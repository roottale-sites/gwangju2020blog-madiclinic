import { afterEach, describe, expect, test, vi } from 'vitest';

import { sanitizeCmsHtml, sanitizeImportedCmsHtml } from './raw-html';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('긴 대시 제거', () => {
  test.each([
    ['일반 CMS HTML', sanitizeCmsHtml, '<p>앞 — 뒤</p>'],
    ['이관 HTML', sanitizeImportedCmsHtml, '<p>앞 — 뒤</p>'],
  ])('%s은 화면에 긴 대시를 남기지 않는다', (_label, sanitize, source) => {
    const html = sanitize(source);

    expect(html).toBe('<p>앞  뒤</p>');
    expect(html).not.toContain('—');
  });
});

/**
 * 원본 HTML 정화 어댑터 계약.
 *
 * 공용 살균기는 `<thead>`·`<tfoot>`·`<b>`를 모른다. 이 어댑터는 그 셋의 의미만
 * 되살리고 위험 판정은 전부 살균기에 맡긴다. 그래서 이 파일은 두 축을 함께
 * 고정한다 — 안전한 의미는 살아남고, 위험한 것은 여전히 죽는다.
 */
describe('안전한 표 구조 보존', () => {
  test('<thead>는 thead 그대로 살아남는다', () => {
    const html = sanitizeCmsHtml(
      '<table><thead><tr><th>머리</th></tr></thead><tbody><tr><td>몸</td></tr></tbody></table>',
    );

    expect(html).toBe(
      '<table><thead><tr><th>머리</th></tr></thead><tbody><tr><td>몸</td></tr></tbody></table>',
    );
  });

  test('<tfoot>도 tfoot 그대로 살아남는다', () => {
    const html = sanitizeCmsHtml(
      '<table><tbody><tr><td>몸</td></tr></tbody><tfoot><tr><td>합계</td></tr></tfoot></table>',
    );

    expect(html).toBe(
      '<table><tbody><tr><td>몸</td></tr></tbody><tfoot><tr><td>합계</td></tr></tfoot></table>',
    );
  });

  test('표 내용과 colspan·rowspan은 그대로다', () => {
    const html = sanitizeCmsHtml(
      '<table><thead><tr><th colspan="2">머리</th></tr></thead><tbody><tr><td rowspan="2">몸</td></tr></tbody></table>',
    );

    expect(html).toContain('<th colspan="2">머리</th>');
    expect(html).toContain('<td rowspan="2">몸</td>');
  });

  test('표 안에 표가 들어와도 구획 짝이 어긋나지 않는다', () => {
    // 마커 tbody 안에 평범한 tbody가 중첩된다. 일괄 치환이면 여기서 무너진다.
    const html = sanitizeCmsHtml(
      '<table><thead><tr><td><table><tbody><tr><td>안쪽</td></tr></tbody></table></td></tr></thead></table>',
    );

    expect(html).toBe(
      '<table><thead><tr><td><table><tbody><tr><td>안쪽</td></tr></tbody></table></td></tr></thead></table>',
    );
  });

  test('마커를 쓰지 않은 평범한 tbody는 건드리지 않는다', () => {
    const html = sanitizeCmsHtml('<table><tbody><tr><td>몸</td></tr></tbody></table>');

    expect(html).toBe('<table><tbody><tr><td>몸</td></tr></tbody></table>');
  });

  test('마커 클래스는 결과에 남지 않는다', () => {
    const html = sanitizeCmsHtml('<table><thead><tr><th>머리</th></tr></thead></table>');

    expect(html).not.toContain('rt-thead');
    expect(html).not.toContain('class=');
  });
});

describe('굵기 의미 보존', () => {
  test('<b>는 <strong>으로 살아남는다', () => {
    expect(sanitizeCmsHtml('<p><b>굵게</b></p>')).toBe('<p><strong>굵게</strong></p>');
  });

  test('<b>로 시작하는 다른 태그는 바꾸지 않는다', () => {
    const html = sanitizeCmsHtml('<blockquote>인용<br>줄</blockquote>');

    expect(html).toContain('<blockquote>');
    expect(html).toContain('<br />');
    expect(html).not.toContain('<strong');
  });

  test('이미 <strong>인 본문은 그대로다', () => {
    expect(sanitizeCmsHtml('<p><strong>굵게</strong></p>')).toBe('<p><strong>굵게</strong></p>');
  });
});

describe('위험한 입력은 여전히 무해하다', () => {
  test.each([
    ['스크립트', '<p>본문</p><script>alert(1)</script>', 'alert(1)'],
    ['iframe', '<p>본문</p><iframe src="https://evil.example"></iframe>', '<iframe'],
    ['이벤트 핸들러', '<p onclick="alert(1)">본문</p>', 'onclick'],
    ['img onerror', '<p>본문</p><img src="x" onerror="alert(1)">', 'onerror'],
  ])('%s는 제거된다', (_label, raw, forbidden) => {
    const html = sanitizeCmsHtml(raw);

    expect(html).not.toContain(forbidden);
    expect(html).toContain('본문');
  });

  test('javascript: 스킴은 실행 가능한 href로 남지 않는다', () => {
    const html = sanitizeCmsHtml('<a href="javascript:alert(1)">링크</a>');

    expect(html).not.toContain('javascript:');
    expect(html).toContain('링크');
  });

  test('<b>에 붙은 이벤트 핸들러는 strong으로 옮겨가도 제거된다', () => {
    // 태그 이름만 바꾸고 속성 판정은 살균기에 맡긴다는 계약의 회귀 테스트.
    const html = sanitizeCmsHtml('<b onclick="alert(1)" style="x">굵게</b>');

    expect(html).not.toContain('onclick');
    expect(html).toContain('굵게');
  });

  test('thead에 붙은 속성은 복원 과정에서 되살아나지 않는다', () => {
    const html = sanitizeCmsHtml(
      '<table><thead onclick="alert(1)" class="evil"><tr><th>머리</th></tr></thead></table>',
    );

    expect(html).not.toContain('onclick');
    expect(html).not.toContain('evil');
    expect(html).toContain('<thead>');
  });

  test('공격자가 마커 클래스를 직접 넣어도 무해한 표 태그만 얻는다', () => {
    // 마커를 위조해봐야 tbody가 thead가 될 뿐 권한이 늘지 않는다.
    const html = sanitizeCmsHtml(
      '<table><tbody class="rt-thead"><tr><td onclick="alert(1)">x</td></tr></tbody></table>',
    );

    expect(html).not.toContain('onclick');
    expect(html).toContain('<thead>');
  });

  test('script 안에 숨긴 thead도 살아 나오지 않는다', () => {
    const html = sanitizeCmsHtml('<script><thead>x</thead></script>');

    expect(html).toBeNull();
  });
});

describe('이미지 origin 정책', () => {
  test('임의 HTTPS 호스트 이미지만 빼고 주변 본문은 보존한다', () => {
    const html = sanitizeCmsHtml(
      '<p>앞<img src="https://evil.example/tracker.png" alt="추적">뒤</p>',
    );

    expect(html).toBe('<p>앞뒤</p>');
  });

  test.each([
    ['배포 사이트', 'https://gwangju2020blog.madiclinic.co.kr/images/column.jpg'],
    ['기본 RootTale API', 'https://api.roottale.com/uploads/column.jpg'],
    ['Cloudflare Images CDN', 'https://imagedelivery.net/account-hash/image-id/md'],
    ['ROOT-ADMIN 미디어 저장소', 'https://root-cdn.com/tenants/t/media/photo.png'],
    ['전환 전 발행 글의 옛 저장소 주소(r2.dev)', 'https://pub-a24f0d2a79bf462a81114ae930fcd320.r2.dev/tenants/t/media/photo.png'],
  ])('%s origin 이미지는 보존한다', (_label, src) => {
    vi.stubEnv('ROOTTALE_API_BASE', '');
    vi.stubEnv('ROOTTALE_MEDIA_ORIGIN', '');

    const html = sanitizeCmsHtml(`<p>앞<img src="${src}" alt="칼럼">뒤</p>`);

    expect(html).toContain(`<img src="${src}" alt="칼럼" />`);
    expect(html).toContain('앞');
    expect(html).toContain('뒤');
  });

  test('설정된 미디어 저장소 origin 이미지는 보존하고 기본 저장소는 더 이상 믿지 않는다', () => {
    vi.stubEnv('ROOTTALE_MEDIA_ORIGIN', 'https://media.example.net');

    const html = sanitizeCmsHtml(
      '<p><img src="https://media.example.net/tenants/t/media/photo.png" alt="칼럼">'
      + '<img src="https://root-cdn.com/tenants/t/media/photo.png" alt="기본"></p>',
    );

    expect(html).toContain('src="https://media.example.net/tenants/t/media/photo.png"');
    expect(html).not.toContain('root-cdn.com');
  });

  test('설정된 RootTale API origin 이미지는 보존한다', () => {
    vi.stubEnv('ROOTTALE_API_BASE', 'https://cms-assets.example/api');

    const html = sanitizeCmsHtml(
      '<p><img src="https://cms-assets.example/uploads/column.jpg" alt="칼럼"></p>',
    );

    expect(html).toContain('src="https://cms-assets.example/uploads/column.jpg"');
  });
});

describe('내부 절대 링크 정규화', () => {
  test('이 배포를 가리키는 절대 링크는 상대 링크가 된다', () => {
    const html = sanitizeCmsHtml(
      '<p><a href="https://gwangju2020blog.madiclinic.co.kr/reviews/%ED%9B%84%EA%B8%B0/?page=2#record">연관 후기</a></p>',
    );

    expect(html).toContain('href="/reviews/%ED%9B%84%EA%B8%B0/?page=2#record"');
    expect(html).not.toContain('href="https://gwangju2020blog.madiclinic.co.kr');
  });

  test('외부 HTTPS 링크는 그대로 둔다', () => {
    expect(sanitizeCmsHtml('<a href="https://example.com/help">도움말</a>'))
      .toContain('href="https://example.com/help"');
  });
});

describe('HTML 가져오기 표현 보존', () => {
  test('원문의 b 태그를 strong으로 바꾸지 않고 그대로 보존한다', () => {
    const html = sanitizeImportedCmsHtml('<p><b class="legacy-bold">원문 굵게</b></p>');

    expect(html).toContain('<b class="legacy-bold">원문 굵게</b>');
    expect(html).not.toContain('<strong');
  });

  test('원문의 내부 절대 링크 문자열을 상대 주소로 바꾸지 않는다', () => {
    const html = sanitizeImportedCmsHtml(
      '<a href="https://gwangju2020blog.madiclinic.co.kr/column/original/?page=2#record">원문 링크</a>',
    );

    expect(html).toContain(
      'href="https://gwangju2020blog.madiclinic.co.kr/column/original/?page=2#record"',
    );
  });

  test('원본 class·id와 안전한 인라인 레이아웃 스타일을 남긴다', () => {
    const html = sanitizeImportedCmsHtml(
      '<section class="source-layout article-lead" id="intro" style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px; color: #223344"><table style="width: 100%; border-collapse: collapse"><tbody><tr><td>본문</td></tr></tbody></table></section>',
    );

    expect(html).toContain('class="source-layout article-lead"');
    expect(html).toContain('id="intro"');
    expect(html).toContain('display:grid');
    expect(html).toContain('grid-template-columns:1fr 2fr');
    expect(html).toContain('gap:24px');
    expect(html).toContain('color:#223344');
    expect(html).toContain('width:100%');
    expect(html).toContain('border-collapse:collapse');
  });

  test('표현 정보를 보존해도 실행 코드와 CSS 외부 리소스는 남기지 않는다', () => {
    const html = sanitizeImportedCmsHtml(
      '<div class="hero" onclick="alert(1)" style="color: #223344; background-image: url(https://evil.example/a.png)"><a href="javascript:alert(2)">링크</a><script>alert(3)</script></div>',
    );

    expect(html).toContain('class="hero"');
    expect(html).toContain('color:#223344');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('url(');
    expect(html).not.toContain('alert(');
    expect(html).not.toContain('<script');
  });

  test('신뢰 origin 이미지는 인라인 스타일과 함께 보존한다', () => {
    const src = 'https://root-cdn.com/tenants/t/media/photo.png';
    const imported = sanitizeImportedCmsHtml(
      `<p>앞<img src="${src}" alt="칼럼" style="height:auto">뒤</p>`,
    );

    expect(imported).toContain(`src="${src}"`);
    expect(imported).toContain('style="height:auto"');
  });

  /**
   * headnerve는 이관 원본(iCRM·Pexels) 호스트를 가져오기 경로에서만 추가로
   * 믿었다. 이 저장소에는 이관 콘텐츠가 없어(PLAN.md §5.3) 가져오기 경로도
   * 일반 본문과 같은 origin 정책을 쓴다.
   */
  test('가져오기 경로도 신뢰 밖 호스트 이미지는 빼고 주변 본문만 남긴다', () => {
    const src = 'https://icrm.co.kr/data/blog_images/column.jpg';

    expect(sanitizeImportedCmsHtml(`<p>앞<img src="${src}" alt="칼럼">뒤</p>`)).toBe('<p>앞뒤</p>');
    expect(sanitizeCmsHtml(`<p>앞<img src="${src}" alt="칼럼">뒤</p>`)).toBe('<p>앞뒤</p>');
  });
});

describe('nullable 계약', () => {
  test.each([
    ['null', null],
    ['undefined', undefined],
    ['빈 문자열', ''],
    ['공백만', '   \n '],
    ['숫자', 42],
  ])('%s는 null이다', (_label, value) => {
    expect(sanitizeCmsHtml(value)).toBeNull();
  });

  test('전부 제거되는 마크업도 null이다', () => {
    expect(sanitizeCmsHtml('<script>alert(1)</script>')).toBeNull();
  });
});


test('에디터 HTML의 이미지 크기와 정렬을 정화 뒤에도 유지한다', () => {
  const html = sanitizeCmsHtml('<figure style="width:50%;display:block;margin-left:auto;margin-right:0"><img src="https://gwangju2020blog.madiclinic.co.kr/photo.jpg" style="width:100%;height:auto"><figcaption>사진 설명</figcaption></figure>');
  expect(html).toContain('width:50%');
  expect(html).toContain('margin-left:auto');
  expect(html).toContain('display:block');
  expect(html).toContain('<figcaption>사진 설명</figcaption>');
});
