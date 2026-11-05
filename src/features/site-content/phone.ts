/** 국내 전화번호의 맨 앞 0만 국가번호로 바꾼다. 형식 오류는 링크·JSON-LD에 쓰지 않는다. */
export function phoneFromDisplay(value: string): { href: string; e164: string } | undefined {
  const phone = value.trim();
  if (!/^0(?:2|[3-6][1-5]|70|10)-\d{3,4}-\d{4}$/.test(phone)) return undefined;
  return { href: `tel:${phone.replaceAll('-', '')}`, e164: `+82-${phone.slice(1)}` };
}
