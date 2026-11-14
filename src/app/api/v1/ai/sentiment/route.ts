import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment } from '@/services/ai/sentiment-analysis';
import { TenantContextManager } from '@/core/database/tenant-context';
import { authorizationErrorResponse, authorizeApiRequest } from '@/services/auth/authorization';
import {
  MAX_AI_REQUEST_BYTES,
  readBoundedJson,
  sentimentRequestSchema,
} from '@/services/ai/resource-limits';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, userId } = await authorizeApiRequest(req);
    const bodyResult = await readBoundedJson(req, MAX_AI_REQUEST_BYTES);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const parsed = sentimentRequestSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Bad Request', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const requestId = req.headers.get('x-request-id') || `req-${Date.now()}`;
    const sentimentResult = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => analyzeSentiment(parsed.data.text)
    );

    return NextResponse.json({ sentiment: sentimentResult });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof RangeError) {
      return NextResponse.json({ error: 'Invalid sentiment input.' }, { status: 400 });
    }
    console.error('[API Sentiment Route Error]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
