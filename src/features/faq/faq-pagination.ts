import { FAQ_INTENTS, type FaqEntry, type FaqIntent } from './faq-model';

const FAQ_ENTRIES_PER_PAGE = 10;

export function parseFaqPageNumber(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function faqPaginationUrl(path: string, page: number, intent?: FaqIntent): string {
  const params = new URLSearchParams();
  if (intent) params.set('intent', intent);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return `${path}${query ? `?${query}` : ''}#faq-question-list`;
}

export function paginateFaqEntries(entries: readonly FaqEntry[], requestedPage: number) {
  // 화면에 보이는 질문 성격 순서대로 나눈다. 페이지를 넘겨도 순서가 뒤섞이지 않는다.
  const ordered = FAQ_INTENTS.flatMap((intent) => entries.filter((entry) => entry.intent === intent));
  const pageCount = Math.max(1, Math.ceil(ordered.length / FAQ_ENTRIES_PER_PAGE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const start = (page - 1) * FAQ_ENTRIES_PER_PAGE;
  return { items: ordered.slice(start, start + FAQ_ENTRIES_PER_PAGE), page, pageCount, total: ordered.length };
}
