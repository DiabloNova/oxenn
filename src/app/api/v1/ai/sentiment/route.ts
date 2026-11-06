import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeSentiment } from '@/services/ai/sentiment-analysis';
import { TenantContextManager } from '@/core/database/tenant-context';
import { authorizationErrorResponse, authorizeApiRequest } from '@/services/auth/authorization';

// Fast input validation schema
const requestSchema = z.object({
  text: z.string().min(1, 'Text to analyze must be provided'),
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

    const { text } = parsed.data;

    // Strict Tenant Context Isolation wrapping
    const requestId = req.headers.get('x-request-id') || `req-${Date.now()}`;

    const sentimentResult = await TenantContextManager.runWithTenantContext(
      tenantId,
      userId,
      requestId,
      async () => {
        return await analyzeSentiment(text);
      }
    );

    return NextResponse.json({ sentiment: sentimentResult });
  } catch (error: unknown) {
    const authResponse = authorizationErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('[API Sentiment Route Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    );
  }
}
