/**
 * ROOT-ADMIN(Tiptap) 본문 JSON에서 첫 이미지 주소를 찾는다.
 *
 * 후기·칼럼이 공유 이미지(og:image·Article JSON-LD)를 고를 때 대표 이미지가 없으면
 * 본문 첫 사진으로 대신한다. 여기서는 형태만 확인하고(https 절대 주소 또는 사이트
 * 상대 경로), 어느 origin을 믿을지는 호출부의 이미지 정책이 정한다.
 */
export function firstBodyImageUrl(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = firstBodyImageUrl(item);
      if (image) return image;
    }
    return null;
  }

  if (!value || typeof value !== 'object') return null;
  const node = value as Record<string, unknown>;
  if (node.type === 'image' && node.attrs && typeof node.attrs === 'object') {
    const src = Reflect.get(node.attrs, 'src');
    if (
      typeof src === 'string' &&
      (src.startsWith('https://') || (src.startsWith('/') && !src.startsWith('//')))
    ) {
      return src;
    }
  }

  return firstBodyImageUrl(node.content);
}
