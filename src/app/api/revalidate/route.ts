import { SITE_PATTERNS_CACHE_TAG, THEME_CACHE_TAG } from '@roottale/cms-client/server';
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
import { faqInternalLinkKeyFromPath } from '../../../features/faq/faq-cache';

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

  const expectedTarget = revalidationTargetForModel(payload.modelKey);
  const paths = expectedTarget === 'faq' && payload.paths.length === 0 ? ['/faq'] : payload.paths;
  const initialTargets = revalidationTargets(verification.event, paths);
  if (
    verification.event.startsWith('post.') &&
    expectedTarget &&
    !initialTargets.includes(expectedTarget)
  ) {
    return rejectInvalidation('model_path_mismatch', verification, payload);
  }
  // 상세 주소가 빠진 삭제/구형 알림은 FAQ 경로 전체로 보완한다. 공용 원장 만료만으로
  // 관련 질문·본문 링크는 최신화되며, 웹훅 응답 전에 CMS 역참조 조회를 하지 않는다.
  const fallbackFaqPaths = initialTargets.includes('faq') && verification.event.startsWith('post.') &&
    !paths.some((path) => faqInternalLinkKeyFromPath(path) !== null);

  // 공통 블록 저장·발행·비공개도 theme.updated로 전달된다.
  if (verification.event === 'theme.updated') {
    revalidateTag(THEME_CACHE_TAG, { expire: 0 });
    revalidateTag(SITE_PATTERNS_CACHE_TAG, { expire: 0 });
    revalidatePath('/', 'layout');
  }

  const targets = revalidationTargets(verification.event, paths);
  if (verification.event.startsWith('post.') && targets.length === 0) {
    return rejectInvalidation('unsupported_revalidation_target', verification, payload);
  }
  if (targets.length === 0) return json({ ok: true, revalidated: false, paths: [] }, 200);

  const revalidatedPaths = new Set<string>();
  for (const target of targets) {
    // slug는 모델이 가리키는 컬렉션의 글에만 해당한다.
    const slug = target === expectedTarget ? payload.slug : undefined;
    for (const tag of revalidationTagsFor(target, verification.event, paths, slug)) {
      revalidateTag(tag, { expire: 0 });
    }
    for (const path of revalidationPathsFor(target, paths)) {
      if (revalidatedPaths.has(path)) continue;
      revalidatePath(path);
      revalidatedPaths.add(path);
    }
    if (isSiteWideEvent(verification.event) || (target === 'faq' && fallbackFaqPaths)) {
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
    ...(fallbackFaqPaths ? { faqPathScope: 'fallback-all' } : {}),
  }));
  return json({ ok: true, revalidated: true, paths: [...revalidatedPaths] }, 200);
}

export function GET(): Response {
  return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST', 'cache-control': 'no-store' } });
}
