import { verifyRootTaleWebhook } from '@roottale/cms-client/webhook';
import { revalidatePath, revalidateTag } from 'next/cache';

import {
  isSiteWideEvent,
  readRevalidationPayload,
  revalidationPathsFor,
  revalidationTagsFor,
  revalidationTargetForModel,
  revalidationTargets,
} from '../../../features/cms/revalidation';

const MAX_WEBHOOK_BYTES = 64 * 1024;

/** 분류·테마처럼 사이트 전체가 바뀔 때만 사용하는 동적 라우트 패턴. */
const TARGET_DYNAMIC_ROUTES = {
  reviews: ['/reviews/[slug]'],
  column: ['/column/[category]', '/column/[category]/[slug]'],
  faq: ['/faq/[section]', '/faq/[section]/[topic]', '/faq/[section]/[topic]/[slug]'],
} as const;

function json(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function rejectInvalidation(
  reason: 'model_path_mismatch' | 'unsupported_revalidation_target',
  verification: { readonly deliveryId: string; readonly event: string },
  payload: { readonly modelKey?: string; readonly paths: readonly string[] },
): Response {
  console.warn(JSON.stringify({
    message: 'CMS 캐시 무효화 대상 오류',
    deliveryId: verification.deliveryId,
    event: verification.event,
    modelKey: payload.modelKey ?? null,
    pathCount: payload.paths.length,
    reason,
  }));
  return json({ ok: false, reason }, 422);
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_WEBHOOK_BYTES) return json({ ok: false }, 413);

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_WEBHOOK_BYTES) return json({ ok: false }, 413);

  const apiKey = process.env.ROOTTALE_API_KEY?.trim();
  if (!apiKey || apiKey === 'local_unconfigured') return json({ ok: false, reason: 'service_unconfigured' }, 503);

  const verification = await verifyRootTaleWebhook({
    rawBody,
    headers: request.headers,
    apiKey,
    apiBase: process.env.ROOTTALE_API_BASE?.trim() || 'https://api.roottale.com',
  });
  if (!verification.ok) return json({ ok: false }, 401);

  const payload = readRevalidationPayload(rawBody);
  if (!payload) return json({ ok: false }, 400);

  const initialTargets = revalidationTargets(verification.event, payload.paths);
  const expectedTarget = revalidationTargetForModel(payload.modelKey);
  if (
    verification.event.startsWith('post.') &&
    expectedTarget &&
    !initialTargets.includes(expectedTarget)
  ) {
    return rejectInvalidation('model_path_mismatch', verification, payload);
  }
  /**
   * headnerve는 여기서 FAQ 발행 글을 "공개 FAQ 선택"으로 역참조한 상세까지 찾아
   * 함께 무효화한다(`faq-revalidation.affectedFaqDetailPaths`). 그 계산은 FAQ
   * 원장(`faq-source`)이 있어야 하므로 7단계에서 이 자리에 다시 넣는다.
   */
  const paths = payload.paths;

  const targets = revalidationTargets(verification.event, paths);
  if (verification.event.startsWith('post.') && targets.length === 0) {
    return rejectInvalidation('unsupported_revalidation_target', verification, payload);
  }
  if (targets.length === 0) return json({ ok: true, revalidated: false, paths: [] }, 200);

  const revalidatedPaths = new Set<string>();
  for (const target of targets) {
    for (const tag of revalidationTagsFor(target, verification.event, paths)) {
      revalidateTag(tag, { expire: 0 });
    }
    for (const path of revalidationPathsFor(target, paths)) {
      if (revalidatedPaths.has(path)) continue;
      revalidatePath(path);
      revalidatedPaths.add(path);
    }
    if (isSiteWideEvent(verification.event)) {
      for (const dynamicRoute of TARGET_DYNAMIC_ROUTES[target]) {
        revalidatePath(dynamicRoute, 'page');
      }
    }
  }

  console.log(JSON.stringify({
    message: 'CMS 캐시 무효화',
    deliveryId: verification.deliveryId,
    event: verification.event,
    targets,
    pathCount: revalidatedPaths.size,
  }));
  return json({ ok: true, revalidated: true, paths: [...revalidatedPaths] }, 200);
}

export function GET(): Response {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST', 'cache-control': 'no-store' } });
}
