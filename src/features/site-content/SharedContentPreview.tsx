import MadiFooter from '../../components/madi/MadiFooter';
import ClinicGuide from '../clinic-guide/ClinicGuide';
import MedicalNotice from './MedicalNotice';
import { bindGroup, contentAttributes, record, present, safeContentHref, sectionVisible, snake, type SiteContent } from './bindings';
import { commonDefaults, guideDefaults, footerDefaults, type SharedModelKey } from './defaults';
import { phoneFromDisplay } from './phone';
import manifest from '../../../cms/content-import.json';

function guideShown(guide: ReturnType<typeof guideDefaults>) {
  const { clinic, labels } = guide;
  const paths: string[] = [];
  for (const key of ['guideName','holidayNote','lunchNote'] as const) if (present(clinic[key])) paths.push(`clinic.${key}`);
  if (present(clinic.address.detail)) paths.push('clinic.address.detail');
  paths.push('clinic.doctorPortrait.alt');
  for (const key of ['representative','representativeTitle'] as const) if (present(clinic[key])) paths.push(`clinic.${key}`);
  if (phoneFromDisplay(clinic.phoneDisplay)) {
    paths.push('clinic.phoneDisplay');
    if (present(labels.phone)) paths.push('labels.phone');
  }
  if (present(labels.hours)) paths.push('labels.hours');
  clinic.hours.forEach((hour, index) => { if (present(hour.label) && present(hour.value)) paths.push(`clinic.hours.${index}.label`, `clinic.hours.${index}.value`); });
  clinic.directions.forEach((direction, index) => { if (present(direction.label) && present(direction.text)) paths.push(`clinic.directions.${index}.label`, `clinic.directions.${index}.text`); });
  for (const [label, channel] of [['question','cafe'],['booking','naverBooking'],['blog','blog'],['talk','naverTalk'],['kakao','kakao']] as const) {
    if (present(labels[label]) && safeContentHref(clinic.social[channel])) paths.push(`labels.${label}`);
  }
  return paths;
}
function footerShown(shared: typeof commonDefaults) {
  const paths: string[] = [];
  for (const key of ['businessNumber','phoneDisplay','faxDisplay','email','copyright'] as const) {
    if (present(shared.clinic[key])) paths.push(`clinic.${key}`);
  }
  if (present(shared.clinic.businessNumber) && present(shared.footer.business)) paths.push('footer.business');
  if (present(shared.clinic.phoneDisplay) && present(shared.footer.phone)) paths.push('footer.phone');
  if (present(shared.clinic.faxDisplay) && present(shared.footer.fax)) paths.push('footer.fax');
  if (present(shared.clinic.email) && present(shared.footer.email)) paths.push('footer.email');
  if (present(shared.clinic.address.line)) paths.push('clinic.address.line');
  for (const key of ['representative','representativeTitle'] as const) if (present(shared.clinic[key])) paths.push(`clinic.${key}`);
  if ((present(shared.clinic.representative) || present(shared.clinic.representativeTitle)) && present(shared.footer.representative)) paths.push('footer.representative');
  return paths;
}
function labelFor(path: readonly string[]): string {
  const group = manifest.fieldGroups.find(group => group.fields[0]?.name === path[0]);
  type Field = { name: string; label: string; subFields?: Field[] };
  let fields: Field[] = group?.fields ?? [];
  const labels: string[] = [];
  for (const key of path.filter(key => !/^\d+$/.test(key))) {
    const field = fields.find(field => field.name === snake(key));
    if (!field) break;
    labels.push(field.label); fields = field.subFields ?? [];
  }
  return labels.slice(1).join(' · ');
}
function RemainingFields({ value, root, shown, hidden = [] }: { value: object; root: string; shown: readonly string[]; hidden?: readonly string[] }) {
  function rows(owner: unknown, path: string[] = []): React.ReactElement[] {
    if (Array.isArray(owner)) return owner.flatMap((item, index) => record(item) ? rows(item, [...path, String(index)]) : [
      <div key={[...path,index].join('.')}><dt>{labelFor([root,...path,'value'])} {index+1}</dt><dd {...contentAttributes(owner,index)}>{String(item).trim() ? String(item) : '비어 있음'}</dd></div>,
    ]);
    if (!record(owner)) return [];
    return Object.entries(owner).flatMap(([key, item]) => {
      const next = [...path, key];
      const joined = next.join('.');
      if (hidden.some(prefix => joined === prefix || joined.startsWith(`${prefix}.`))) return [];
      if (shown.includes(joined)) return [];
      if (item && typeof item === 'object') return rows(item, next);
      return <div key={joined}>
        <dt>{labelFor([root,...next])}</dt>
        <dd {...contentAttributes(owner,key)}>{String(item ?? '').trim() ? String(item) : '비어 있음'}</dd>
      </div>;
    });
  }
  const items = rows(value);
  return items.length ? <dl className="site-content-fields">{items}</dl> : null;
}
export default function SharedContentPreview({ modelKey, content }: { modelKey: SharedModelKey; content: SiteContent }) {
  if (modelKey === 'clinic-common') {
    const shared = bindGroup(content, modelKey, 'shared', commonDefaults);
    return <>
      <MadiFooter content={content} />
      <div id="subContainer" className="clearFix"><main id="main" className="cBoxArea community-content clearFix">
        <RemainingFields value={shared} root="shared" shown={footerShown(shared)} hidden={['physician.alternateName']} />
      </main></div>
    </>;
  }
  const footer = bindGroup(content, modelKey, 'footer', { guide: guideDefaults(), notice: footerDefaults[modelKey].notice });
  const cards = <><ClinicGuide content={content} modelKey={modelKey} /><MedicalNotice content={content} modelKey={modelKey} /></>;
  return <div id="subContainer" className="clearFix"><main id="main" className="cBoxArea community-content clearFix">
    {modelKey === 'column-footer' ? (
      <div className="cBox column-detail-page clearFix"><article className="column-detail"><div className="column-shell">
        <div className="column-detail__layout"><div className="column-detail__reading">{cards}</div></div>
      </div></article></div>
    ) : modelKey === 'reviews-footer' ? (
      <div className="cBox review-detail-page clearFix"><article className="review-detail"><div className="reviews-shell review-detail__surface">
        <div className="review-detail__content-grid">{cards}</div>
      </div></article></div>
    ) : (
      <div className="cBox faq-page clearFix"><div className="faq-layout"><article className="faq-detail faq-layout__main">
        <section className="faq-answer-card"><MedicalNotice content={content} modelKey={modelKey} /></section>
        <ClinicGuide content={content} modelKey={modelKey} />
      </article></div></div>
    )}
    <RemainingFields value={footer} root="footer" shown={[...guideShown(footer.guide).map(path => `guide.${path}`), 'notice.title', 'notice.body']}
      hidden={sectionVisible(content,modelKey,'guide') ? [] : ['guide']} />
  </main></div>;
}
