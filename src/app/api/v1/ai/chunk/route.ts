import { NextRequest, NextResponse } from 'next/server';
import { authorizeApiRequest, AuthorizationError } from '@/services/auth/authorization';
import { z } from 'zod';
import { chunkText } from '@/services/ai/text-chunker';
import { TenantContextManager } from '@/core/database/tenant-context';

// Input validation schema
const requestSchema = z.object({
  text: z.string().min(1, 'Text to chunk must be provided'),
  maxChunkSize: z.number().int().positive().optional().default(500),
  overlap: z.number().int().nonnegative().optional().default(50),
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId: organizationId, userId } = await authorizeApiRequest(req);
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
      organizationId,
      userId,
      requestId,
      async () => {
        return chunkText(text, maxChunkSize, overlap);
      }
    );

    return NextResponse.json({ chunks });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.statusCode === 403 ? "Forbidden" : "Unauthorized", message: error.message },
        { status: error.statusCode }
      );
    }
    console.error('[API Chunk Route Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    );
  }
}
