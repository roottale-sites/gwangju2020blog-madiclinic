import { siteOrigin } from '../../data/site';

const preferredSourceUrl = new URL('https://www.google.com/preferences/source');
preferredSourceUrl.searchParams.set('q', new URL(siteOrigin).hostname);

export default function PreferredSourceLink() {
  return (
    <div className="preferred-source-action">
      <a className="preferred-source__link" href={preferredSourceUrl.toString()}
        target="_blank" rel="noopener noreferrer"
        aria-label="Google에서 마디클리닉을 선호 출처로 추가 (새 창)">
        <img src="/assets/brands/google-g.png" width="20" height="20" alt="" aria-hidden="true" />
        <span>선호 출처로 추가</span>
      </a>
    </div>
  );
}
