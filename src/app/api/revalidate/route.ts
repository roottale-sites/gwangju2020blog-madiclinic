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
import { affectedFaqDetailPaths } from '../../../features/faq/faq-revalidation';
import { resolveFaqArchive } from '../../../features/faq/faq-source';

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
  let paths = payload.paths;
  if (initialTargets.includes('faq') && verification.event.startsWith('post.')) {
    // 캐시본이 아니라 CMS를 직접 읽는다 — 방금 발행된 글을 "공개 FAQ 선택"으로 고른
    // 상세 화면은 캐시본의 관계 필드에 그 글이 없어(발행 전 제외) 갱신 대상에서 빠진다.
    const archive = await resolveFaqArchive({ fresh: true });
    paths = [...new Set([
      ...paths,
      ...affectedFaqDetailPaths(archive.entries, {
        paths,
        ...(payload.postId ? { postId: payload.postId } : {}),
      }),
    ])];
  }

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
