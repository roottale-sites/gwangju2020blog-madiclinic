import { bindGroup, contentAttributes as edit, present, safeContentHref, type SiteContent } from '../../features/site-content/bindings';
import { commonDefaults } from '../../features/site-content/defaults';

/** 상세 글에서 환자 커뮤니티의 질문 작성으로 연결한다. */
export default function ContentCafeLink({ content }: { content?: SiteContent } = {}) {
  const { clinic, pageCommon } = bindGroup(content, 'clinic-common', 'shared', commonDefaults);
  const href = safeContentHref(clinic.social.cafe);
  if (!href || !present(pageCommon.cafe)) return null;
  return (
    <a className="content-cafe-link" href={href}
      target="_blank" rel="noopener noreferrer" data-analytics-id="cafe-question" data-analytics-cta="true"
      data-analytics-placement="article-header"
      aria-label="네이버 카페에 질문하기 (새 창)">
      <img src="/assets/brands/naver-cafe.png" width="20" height="20" alt="" aria-hidden="true" />
      <span {...edit(pageCommon, 'cafe')}>{pageCommon.cafe}</span>
    </a>
  );
}
