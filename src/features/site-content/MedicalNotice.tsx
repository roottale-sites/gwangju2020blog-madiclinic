import { bindGroup, contentAttributes as edit, type SiteContent } from './bindings';
import { footerDefaults, type FooterModelKey } from './defaults';
const properties = {
  'column-footer': { className: 'column-disclaimer', label: '의료 콘텐츠 안내' },
  'reviews-footer': { className: 'review-detail__note', label: '치료 경험담 안내' },
  'faq-footer': { className: 'faq-medical-note', label: '의료 정보 안내' },
};
export default function MedicalNotice({ content, modelKey }: { content?: SiteContent; modelKey: FooterModelKey }) {
  const defaults = footerDefaults[modelKey].notice;
  const { notice } = bindGroup(content, modelKey, 'footer', { notice: defaults });
  // 의료 고지는 빈 값·섹션 숨김 설정으로 사라지지 않는다.
  return <aside className={properties[modelKey].className} aria-label={properties[modelKey].label}>
    <strong {...edit(notice, 'title')}>{notice.title.trim() ? notice.title : defaults.title}</strong>
    <p {...edit(notice, 'body')}>{notice.body.trim() ? notice.body : defaults.body}</p>
  </aside>;
}
