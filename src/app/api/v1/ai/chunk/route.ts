import { NextRequest, NextResponse } from 'next/server';
import { chunkText } from '@/services/ai/text-chunker';
import { TenantContextManager } from '@/core/database/tenant-context';
import { authorizationErrorResponse, authorizeApiRequest } from '@/services/auth/authorization';
import {
  chunkRequestSchema,
  MAX_CHUNK_REQUEST_BYTES,
  readBoundedJson,
} from '@/services/ai/resource-limits';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, userId } = await authorizeApiRequest(req);
    const bodyResult = await readBoundedJson(req, MAX_CHUNK_REQUEST_BYTES);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const parsed = chunkRequestSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad Request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { text, maxChunkSize, overlap } = parsed.data;
    const requestId = req.headers.get('x-request-id') || `req-${Date.now()}`;

    const chunks = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => chunkText(text, maxChunkSize, overlap)
    );

    return NextResponse.json({ chunks });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof RangeError) {
      return NextResponse.json({ error: 'Invalid chunking input.' }, { status: 400 });
    }
    console.error('[API Chunk Route Error]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
