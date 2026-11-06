import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chunkText } from '@/services/ai/text-chunker';
import { TenantContextManager } from '@/core/database/tenant-context';
import { authorizationErrorResponse, authorizeApiRequest } from '@/services/auth/authorization';

// Input validation schema
const requestSchema = z.object({
  text: z.string().min(1, 'Text to chunk must be provided'),
  maxChunkSize: z.number().int().positive().optional().default(500),
  overlap: z.number().int().nonnegative().optional().default(50),
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId, userId } = await authorizeApiRequest(req);
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad Request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { text, maxChunkSize, overlap } = parsed.data;

    // Strict Tenant Context Isolation wrapping
    const requestId = req.headers.get('x-request-id') || `req-${Date.now()}`;

    const chunks = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        return chunkText(text, maxChunkSize, overlap);
      }
    );

    return NextResponse.json({ chunks });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('[API Chunk Route Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    );
  }
}
