/** 개발·미리보기용 수신 경로. 저장하거나 운영 수집기로 전달하지 않는다. */
export async function POST() {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
