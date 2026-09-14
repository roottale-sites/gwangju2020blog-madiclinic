import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import { __useLocalJwksForTesting } from '@roottale/cms-client/webhook';

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath,
  revalidateTag,
  unstable_cache: (callback: (...args: unknown[]) => unknown) => callback,
}));

const { POST } = await import('./route');

const API_BASE = 'https://local-webhook-jwks.test';
const API_KEY = 'test_signature_boundary_key';
const KEY_ID = 'test-p256-key';
const NOW_SECONDS = 1_800_000_000;
const encoder = new TextEncoder();

let privateKey: CryptoKey;
let publicJwk: JsonWebKey & { kty: string; kid: string; alg: string; use: string };

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function encodeJson(value: Record<string, unknown>): string {
  return base64Url(encoder.encode(JSON.stringify(value)));
}

async function bodySha256(rawBody: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(rawBody));
  return base64Url(new Uint8Array(digest));
}

async function signWebhookToken(
  rawBody: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const protectedHeader = encodeJson({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' });
  const payload = encodeJson({
    iss: 'https://api.roottale.com',
    aud: 'roottale-webhook',
    site_id: 'site_test',
    body_sha256: await bodySha256(rawBody),
    event: 'post.published',
    jti: 'delivery-test',
    iat: NOW_SECONDS,
    exp: NOW_SECONDS + 60,
    ...overrides,
  });
  const signingInput = `${protectedHeader}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(signingInput),
  );

  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
}

function webhookRequest(rawBody: string, signature?: string): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (signature) headers.set('x-roottale-signature', signature);

  return new Request('https://gwangju2020blog.madiclinic.co.kr/api/revalidate', {
    method: 'POST',
    headers,
    body: rawBody,
  });
}

beforeAll(async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  privateKey = keyPair.privateKey;
  const exportedPublicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  if (!exportedPublicJwk.kty) throw new Error('P-256 public JWK is missing kty');
  publicJwk = {
    ...exportedPublicJwk,
    kty: exportedPublicJwk.kty,
    kid: KEY_ID,
    alg: 'ES256',
    use: 'sig',
  };
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW_SECONDS * 1_000);
  vi.stubEnv('ROOTTALE_API_KEY', API_KEY);
  vi.stubEnv('ROOTTALE_API_BASE', API_BASE);
  __useLocalJwksForTesting(API_BASE, API_KEY, { keys: [publicJwk] });
  revalidatePath.mockReset();
  revalidateTag.mockReset();
});

afterEach(() => {
  revalidatePath.mockReset();
  revalidateTag.mockReset();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('POST 웹훅 서명 경계', () => {
  test('정확한 raw body에 묶인 유효한 서명만 캐시를 무효화한다', async () => {
    const rawBody = JSON.stringify({ paths: ['/column/headache/signed-post'] });
    const signature = await signWebhookToken(rawBody);

    const response = await POST(webhookRequest(rawBody, signature));

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith('column:archive', { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith('column:detail:signed-post', { expire: 0 });
    expect(revalidatePath).toHaveBeenCalledWith('/column/headache/signed-post');
  });

  test('같은 서명으로 본문을 바꾸면 401이고 캐시를 무효화하지 않는다', async () => {
    const signedBody = JSON.stringify({ paths: ['/column/signed-post'] });
    const tamperedBody = JSON.stringify({ paths: ['/column/tampered-post'] });
    const signature = await signWebhookToken(signedBody);

    const response = await POST(webhookRequest(tamperedBody, signature));

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('서명이 없으면 401이고 캐시를 무효화하지 않는다', async () => {
    const rawBody = JSON.stringify({ paths: ['/column/unsigned-post'] });

    const response = await POST(webhookRequest(rawBody));

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('만료된 서명은 401이고 캐시를 무효화하지 않는다', async () => {
    const rawBody = JSON.stringify({ paths: ['/column/expired-post'] });
    const signature = await signWebhookToken(rawBody, {
      iat: NOW_SECONDS - 601,
      exp: NOW_SECONDS - 301,
    });

    const response = await POST(webhookRequest(rawBody, signature));

    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
