import Link from 'next/link';
import type { Metadata } from 'next';

import type { FaqLoadFailure } from './faq-api';
import { faqIndexMetadata, faqNotices, faqTitleWithSuffix } from './faq-content';
import FaqPageFrame, { FAQ_BREADCRUMB_ROOT } from './FaqPageFrame';

/**
 * CMS를 읽을 수 없을 때의 하위 단계 화면.
 *
 * 없는 분류·없는 글은 404다. 그러나 비밀값 미설정·모델 미선언·CMS 장애에서는 그
 * 주소가 없다고 단정할 수 없다 — 나중에 살아날 주소를 크롤러에 404로 알리게 된다.
 * 후기 상세와 같은 판정으로 200 + 상태 안내를 준다(`noindex, follow`).
 */
export function faqStateMetadata(status: FaqLoadFailure): Metadata {
  return {
    title: { absolute: faqTitleWithSuffix('자주 묻는 질문 연결 오류') },
    description: faqNotices[status],
    robots: { index: false, follow: true },
  };
}

export default function FaqStatePage({ pathname, status }: Readonly<{
  pathname: string;
  status: FaqLoadFailure;
}>) {
  return (
    <FaqPageFrame pathname={pathname} crumbs={FAQ_BREADCRUMB_ROOT} jsonLd={[]}>
      <section className="faq-state" aria-labelledby="faq-state-title">
        <h2 id="faq-state-title">자주 묻는 질문을 불러오지 못했습니다</h2>
        <p>{faqNotices[status]}</p>
        <Link className="faq-state__link" href="/faq">
          {faqIndexMetadata.label} 처음으로
        </Link>
      </section>
    </FaqPageFrame>
  );
}
