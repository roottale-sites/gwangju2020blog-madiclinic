import { bindGroup, contentAttributes, present, type SiteContent } from '../../features/site-content/bindings';
import { commonDefaults } from '../../features/site-content/defaults';
import { siteOrigin } from '../../data/site';

const preferredSourceUrl = new URL('https://www.google.com/preferences/source');
preferredSourceUrl.searchParams.set('q', new URL(siteOrigin).hostname);

export default function PreferredSourceLink({ content }: { content?: SiteContent } = {}) {
  const { pageCommon } = bindGroup(content, 'clinic-common', 'shared', commonDefaults);
  if (!present(pageCommon.preferredSource)) return null;
  return (
    <div className="preferred-source-action">
      <a className="preferred-source__link" href={preferredSourceUrl.toString()}
        target="_blank" rel="noopener noreferrer"
        aria-label="Google에서 마디클리닉을 선호 출처로 추가 (새 창)">
        <img src="/assets/brands/google-g.png" width="20" height="20" alt="" aria-hidden="true" />
        <span {...contentAttributes(pageCommon, 'preferredSource')}>{pageCommon.preferredSource}</span>
      </a>
    </div>
  );
}
