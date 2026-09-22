# 마디클리닉 블로그 디자인 토큰 계약

- 작성: 2026-09-14
- 출처: `http://gwangju2020.madiclinic.co.kr/` 의 `css/baseStyle.css`·`css/mainStyle.css`·`css/subStyle.css`(2026-09-14 실측 추출). 값은 본 사이트에서 가져오며 새로 만들지 않는다.
- 자산 정본: `docs/assets/madiclinic-brand/`(로고·파비콘·서브 배너), `docs/assets/madiclinic-header/`(헤더 CSS·마크업·아이콘)
- 적용 파일: `src/styles/tokens.css`(§7 그대로 옮김). headnerve의 `--figma-*` 토큰과 Pretendard·Noto Serif KR은 쓰지 않는다.

## 1. 색

역할은 본 사이트에서 그 값이 쓰인 자리로 정했다. 괄호는 원본 CSS 출현 횟수.

### 1.1 브랜드·강조

| 토큰 | 값 | 본 사이트에서의 자리 |
|---|---|---|
| `--madi-primary` | `#08539d` (5) | 헤더 `통합마디클리닉 바로가기` 버튼, `.cBox h4` 소제목 밑줄, `.commonBox` 상단선, 탭 활성 대안색 |
| `--madi-primary-hover` | `#2e60a1` (2) | 상단 지점 탭 `.on`/hover 배경, 클리닉 그룹 활성 |
| `--madi-primary-soft` | `rgba(46,96,161,.7)` | 상단 SNS 아이콘 hover |
| `--madi-accent-line` | `rgba(89,113,176,.6)` | GNB hover 밑줄 60×1px |
| `--madi-link` | `#3163b4` | 표 안 링크·버튼(`table a`, `table a.bt`) |
| `--madi-submenu-bg` | `rgba(145,37,195,.8)` | GNB 드롭다운 배경(헤더 재현에만 쓰고 본문에는 쓰지 않는다) |
| `--madi-tab-active` | `#414a59` | `ul.tabMenuArea > li.on` |
| `--madi-danger` | `#e7404f` | `.caution03`, `.pColorRed` |

### 1.2 텍스트

| 토큰 | 값 | 자리 |
|---|---|---|
| `--madi-text-strong` | `#222` (35) | h1~h6, 링크 hover, 강조 본문 |
| `--madi-text` | `#444` (17) | body 기본, 링크 기본 |
| `--madi-text-muted` | `#666` (4) | 보조 설명, 브레드크럼 드롭다운 |
| `--madi-text-subtle` | `#777` (11) | 부제(`.subject`), 탭 비활성 |
| `--madi-text-faint` | `#999` (14) | 영문 소제목, 플레이스홀더 |
| `--madi-text-disabled` | `#bbb` (4) | 저작권 |
| `--madi-title-navy` | `rgba(68,78,88,1)` | 서브 배너 h2, `.subTitleArea h3`, 의사 이름 |
| `--madi-text-inverse` | `#fff` | 어두운 배경 위 글자 |

### 1.3 표면·경계

| 토큰 | 값 | 자리 |
|---|---|---|
| `--madi-bg` | `#fff` | body, `#subContainer` |
| `--madi-bg-soft` | `#f9f9f9` (3) | 브레드크럼 줄 `.whereIsLine`, 표 머리 |
| `--madi-bg-panel` | `#f8f9fa` (4) | `.commonBox`, 예약 안내 박스 |
| `--madi-bg-panel-title` | `#e6eaed` (7) | `.commonTitle` 왼쪽 제목 칸 |
| `--madi-bg-tip` | `#f8f8f6` (3) | `.helpfulTipText`, `.symptomBox` |
| `--madi-bg-tip-title` | `#eae9e6` (3) | `.helpfulTipTitle` |
| `--madi-bg-tab` | `#f3f4f1` | 탭 비활성 배경, hover `#dfe3d8` |
| `--madi-bg-topline` | `#e5e5e5` | 헤더 상단 띠 |
| `--madi-bg-topline-strong` | `#cecece` | 지점 탭·SNS 영역 |
| `--madi-border` | `#eee` (14) | 표 셀, 브레드크럼 줄, 드로어 메뉴 구분선 |
| `--madi-border-strong` | `#ddd` (8) | 카드 외곽 |
| `--madi-dim` | `rgba(0,0,0,.8)` | 모바일 드로어 딤 |
| `--madi-footer-bg` | `rgba(53,58,81,.7)` 위 `rgba(45,41,61,.6)` | `#bottom` 배경 이미지 오버레이 |
| `--madi-footer-nav-bg` | `rgba(0,0,0,.6)` | 푸터 하단 띠 |

## 2. 글꼴

| 토큰 | 값 |
|---|---|
| `--madi-font` | `'Noto Sans KR', 'Nanum Gothic', 'Malgun Gothic', '맑은 고딕', sans-serif` |
| `@font-face` | Noto Sans KR 100·300·400·500·700·900, `//fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-{Thin,Light,Regular,Medium,Bold,Black}.{woff2,woff,otf}`. 헤더·본문 모두 같은 파일을 쓴다(`docs/assets/madiclinic-header/header.css` L8-55) |
| `word-break` | `keep-all`, `word-wrap: break-word` |

### 2.1 크기 단계(원본 출현 빈도순)

| 토큰 | 값 | 자리 |
|---|---|---|
| `--madi-fs-xs` | 11px | 저작권 |
| `--madi-fs-sm` | 12px (24) | 회사 정보, 드롭다운 |
| `--madi-fs-base-sm` | 13px (43) | 표, 지점 탭, 버튼 |
| `--madi-fs-base` | 14px (36) | 드롭다운·탭·푸터 메뉴 |
| `--madi-fs-md` | 15px (23) | 안내 박스 본문 |
| `--madi-fs-body` | 16px (15) | body 기본, `.subject` |
| `--madi-fs-lg` | 18px (17) | GNB, `.cBox h5`, 영문 소제목 |
| `--madi-fs-h4` | 20px | h4 |
| `--madi-fs-h3` | 24px (12) | h3 |
| `--madi-fs-h2` | 30px | h2 기본 |
| `--madi-fs-h1` | 34px | h1 기본 |
| `--madi-fs-section` | 36px | 서브 배너 제목, `.cBox h4` |
| `--madi-fs-display` | 48px | 메인 섹션 제목(`.titleArea h2`) |

### 2.2 굵기·행간·자간

- 굵기: 400 본문, 300 안내 박스, 500 GNB·h5, 700 제목·버튼. 200은 푸터 회사 정보. `bold` 키워드는 h1~h6.
- 행간: 본문 `1.67em`(p·li), 안내 박스 `1.56em`, 고정 행간 20px(작은 글), 30px(h3·h4), 40px(h2·배너 제목·GNB), 60px(대제목).
- 자간: 제목 `-1px`·`-2px`(36px 이상), 소형 UI `-0.5px`, 본문 `0`.

### 2.3 제목 기본값(baseStyle L74-79)

| 요소 | 크기/행간 | 색 |
|---|---|---|
| h1 | 34/50 | `#222` bold |
| h2 | 30/40 | `#222` bold |
| h3 | 24/30 | `#222` bold |
| h4 | 20/30 | `#222` bold |
| h5 | 16/25 | `#222` bold |
| h6 | 14/20 | `#222` bold |

## 3. 레이아웃

| 토큰 | 값 | 자리 |
|---|---|---|
| `--madi-container` | 1200px | 헤더·본문·푸터 최대 폭(11회) |
| `--madi-container-narrow` | 960px | ≤1200px에서 메인 섹션 |
| `--madi-min-width` | 320px | body |
| `--madi-header-h` | 140px / ≤980px 120px | 고정 헤더 |
| `--madi-subvisual-h` | 300px / ≤980px 260px / ≤660px 220px / ≤500px 200px | 서브 배너(`padding-top`은 헤더 높이와 같음) |
| `--madi-breadcrumb-h` | 60px | `.whereIsLine` |
| `--madi-section-py` | 80px / ≤980px 60px 10px | `.mcBox` 섹션 상하 여백 |
| `--madi-content-pb` | 60px | `#subContainer` 하단 |
| 여백 단계 | 5·10·20·30·40·60·80px | `.null05~` 스페이서와 padding 값 |

브레이크포인트: `1220`, `1200`, `980`(모바일 전환), `660`, `500`, `420`, `360`px. 새 화면은 `980`을 데스크톱/모바일 경계로, `660`·`420`을 보조로 쓴다.

## 4. 모양

| 토큰 | 값 | 자리 |
|---|---|---|
| `--madi-radius-pill` | 20px (8) | 헤더 버튼(높이 40px), 탭 |
| `--madi-radius-lg` | 40px | 큰 카드 |
| `--madi-radius-md` | 10px | 작은 박스 |
| `--madi-radius-round` | 50% | 아이콘 원 |
| `--madi-shadow-header` | `0 1px 3px 2px rgba(0,0,0,.1)` | 헤더 |
| `--madi-shadow-dropdown` | `1px 1px 4px 2px rgba(0,0,0,.1)` | GNB 드롭다운 |
| `--madi-shadow-soft` | `0 0 7px 3px #f5f5f5` | 카드 |
| `--madi-motion` | `all .3s` (96) | 거의 모든 hover 전환. 드로어 `.5s`, 밑줄 `.6s` |

## 5. 본 사이트 컴포넌트 문법(블로그에 재사용)

블로그 본문은 headnerve 목록·상세 골격을 쓰되 아래 문법을 마디 토큰으로 입힌다.

| 컴포넌트 | 원본 규칙 | 블로그 사용처 |
|---|---|---|
| 서브 배너 `#bnSubArea .subVisualArea` | 높이 300, `padding-top: 140`, 배경 `sbn0N.jpg` cover, h2 36px/700 `--madi-title-navy` 중앙, 자간 -2px | 칼럼·후기·FAQ 상단 띠. 배너 이미지는 `sub-banner/sbn01~05.jpg`(2000×360) 중 칼럼 01, 후기 02, FAQ 03 |
| 브레드크럼 `.whereIsLine ul.whereIs` | 60px 띠, `#f9f9f9`, 상하 `#eee` 선, 홈 아이콘 40px 칸, 상위 항목 140px, 마지막 제목은 남은 너비(최소 240px)와 한 줄 말줄임표·전체 제목 tooltip, `#777` | 배너 바로 아래. headnerve `SiteBreadcrumb` 마크업에 이 스타일 |
| 소제목 `.cBox h4` | 36px/700, `padding-bottom: 19px`, `border-bottom: 1px --madi-primary`, 좌측 정렬 | 목록 페이지 섹션 제목, 상세 본문 h2 |
| 소소제목 `.cBox h5` | 18px/500, 뒤에 80×20 `#efecfd` 하이라이트 | 상세 본문 h3 |
| 안내 박스 `.commonBox` | `border-top: 1px --madi-primary`, `#f8f9fa`, 왼쪽 220px 제목 칸 `#e6eaed`, 본문 15px/300 | 칼럼·후기·FAQ 하단 "진료 안내"(headnerve `ClinicGuide` 자리), 면책 고지 |
| 탭 `ul.tabMenuArea` | 40px, 항목 160px, `#f3f4f1`, 활성 `#414a59` 흰 글자 | 후기·칼럼 목록 필터가 필요할 때 |
| 표 | `border-top: 2px`, 셀 `1px #eee`, 13px, 머리 `#f9f9f9` | 상세 본문 표 |
| 버튼 `table a.bt` | 높이 30px, `#3163b4` 배경, 13px 흰 글자 | 소형 버튼. 주 버튼은 헤더 버튼 문법(40px pill, `--madi-primary`, 14px/700) |
| 푸터 `#bottom` | 배경 이미지 + 오버레이, 메뉴 60px 띠, 로고 240×60, 회사 정보 12px/200 `#eee`, 저작권 11px `#bbb` | 모든 페이지 |

## 6. 로고·아이콘·파비콘

| 자산 | 파일(`docs/assets/madiclinic-brand/`) | 크기 | 자리 |
|---|---|---|---|
| 헤더 로고 | `hi_gwangju2020_20240826.png` | 240×60 | `h1.ci` |
| 모바일 드로어 로고 | `mobileHi_gwangju2020_20240826.png` | 240×60 | `.mobileHome .logo` (표시 160×40) |
| 푸터 로고 | `bottomHI_gwangju2020_20240826.png` | 240×60 | `#bottom .bottomCI` |
| 통합 마디 심볼 | `iconLogoCenter.png` | 60×60 | 헤더 버튼 원형 아이콘 |
| 상단 SNS 아이콘 5종 | `../madiclinic-header/img/iconTopLine*.png` | 40×40 | `ul.topLink` |
| 파비콘 세트 | `favicon/{favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png, android-chrome-192x192.png, android-chrome-512x512.png, safari-pinned-tab.svg, site.webmanifest}` | | `app/` 메타데이터. `site.webmanifest`는 name이 비어 있어 "광주 남구 마디클리닉"으로 채운다 |
| OG 이미지 | 없음(본 사이트 `og:image` 비어 있음) | | 헤더 로고를 1200×630 흰 배경 중앙에 놓아 생성 |

로고 원본은 PNG 240×60만 존재한다. 벡터가 필요하면 고객에게 요청하고, 그 전에는 PNG를 그대로 쓴다(2배 해상도 없음).

## 7. `src/styles/tokens.css` 초안

```css
:root {
  --madi-font: 'Noto Sans KR', 'Nanum Gothic', 'Malgun Gothic', '맑은 고딕', sans-serif;

  --madi-primary: #08539d;
  --madi-primary-hover: #2e60a1;
  --madi-primary-soft: rgba(46, 96, 161, 0.7);
  --madi-accent-line: rgba(89, 113, 176, 0.6);
  --madi-link: #3163b4;
  --madi-tab-active: #414a59;
  --madi-danger: #e7404f;

  --madi-text-strong: #222;
  --madi-text: #444;
  --madi-text-muted: #666;
  --madi-text-subtle: #777;
  --madi-text-faint: #999;
  --madi-text-disabled: #bbb;
  --madi-title-navy: rgb(68, 78, 88);
  --madi-text-inverse: #fff;

  --madi-bg: #fff;
  --madi-bg-soft: #f9f9f9;
  --madi-bg-panel: #f8f9fa;
  --madi-bg-panel-title: #e6eaed;
  --madi-bg-tip: #f8f8f6;
  --madi-bg-tip-title: #eae9e6;
  --madi-bg-tab: #f3f4f1;
  --madi-bg-tab-hover: #dfe3d8;
  --madi-bg-topline: #e5e5e5;
  --madi-bg-topline-strong: #cecece;
  --madi-border: #eee;
  --madi-border-strong: #ddd;
  --madi-dim: rgba(0, 0, 0, 0.8);

  --madi-fs-xs: 11px;  --madi-fs-sm: 12px;  --madi-fs-base-sm: 13px;
  --madi-fs-base: 14px; --madi-fs-md: 15px;  --madi-fs-body: 16px;
  --madi-fs-lg: 18px;  --madi-fs-h4: 20px;  --madi-fs-h3: 24px;
  --madi-fs-h2: 30px;  --madi-fs-h1: 34px;  --madi-fs-section: 36px;
  --madi-fs-display: 48px;
  --madi-lh-body: 1.67em; --madi-lh-panel: 1.56em;
  --madi-ls-title: -1px; --madi-ls-display: -2px; --madi-ls-ui: -0.5px;

  --madi-container: 1200px;
  --madi-container-narrow: 960px;
  --madi-header-h: 140px;
  --madi-subvisual-h: 300px;
  --madi-breadcrumb-h: 60px;
  --madi-section-py: 80px;
  --madi-space-1: 5px; --madi-space-2: 10px; --madi-space-3: 20px;
  --madi-space-4: 30px; --madi-space-5: 40px; --madi-space-6: 60px; --madi-space-7: 80px;

  --madi-radius-pill: 20px; --madi-radius-lg: 40px; --madi-radius-md: 10px; --madi-radius-round: 50%;
  --madi-shadow-header: 0 1px 3px 2px rgba(0, 0, 0, 0.1);
  --madi-shadow-dropdown: 1px 1px 4px 2px rgba(0, 0, 0, 0.1);
  --madi-shadow-soft: 0 0 7px 3px #f5f5f5;
  --madi-motion: all 0.3s;
}
@media (max-width: 980px) {
  :root { --madi-header-h: 120px; --madi-subvisual-h: 260px; --madi-section-py: 60px; }
}
@media (max-width: 660px) { :root { --madi-subvisual-h: 220px; } }
@media (max-width: 500px) { :root { --madi-subvisual-h: 200px; } }
```

헤더 CSS(`header.css`)는 토큰으로 바꾸지 않고 원본 값 그대로 둔다. 1px 재현 대상이라 간접 참조를 두지 않는다.


## 커뮤니티 본문 정렬

`site/community.css`는 원본 헤더·배너와 분리된 본문 공통 규칙이다. 제목과 목록의 좌우 시작선을 맞추고, 바깥 `cBox`가 상단 간격을 한 번만 담당한다(데스크톱 60px, 980px 이하 40px). 모바일 본문 좌우 여백은 20px다.

목록 화면은 배너·현재 위치에서 메뉴와 분류를 알리므로 본문의 반복 제목·소개 문구를 두지 않는다. 블로그·후기는 검색과 목록, FAQ는 분류와 질문으로 바로 시작한다. 상세 글 제목과 CMS 분류 카드의 설명은 유지한다. 블로그·후기 장문은 최대 720px 읽기 폭을 사용한다. CMS 미설정·조회 실패·검색 결과 없음은 구분해서 한 번만 안내한다.

## 커뮤니티 읽기 서식 (2026-09-22 사용자 지정)

GNB는 원본 사이트 문법을 유지한다. 목록·상세의 일반 링크는 기본 밑줄을 숨기고 hover·active·focus에서 220ms로 표시한다. 카드에서 글을 여는 제목·카드 전체 링크는 밑줄 없이 면·글자색 변화로 반응한다. 카드 안의 카테고리·글쓴이 같은 별도 액션은 공통 hover·active·focus 밑줄을 유지한다. 목록에서 글쓴이는 이름만 표시하고 원장 소개 링크를 유지한다. 검색은 목록 도구 줄 안에서 펼치며 Next Form으로 검색 URL을 갱신한다. 검색 결과 수 옆의 `전체 글 보기`는 검색어와 페이지를 초기화한다.

블로그·후기·FAQ 질문 목록은 페이지당 10건이며, 한 페이지만 있어도 현재 번호를 표시한다. 빈 목록·조회 오류에는 페이지네이션을 표시하지 않는다. 페이지 이동은 검색·분류 조건을 유지하고, 카테고리 변경은 첫 페이지로 돌아간다. 블로그·후기 카드의 분류 이름은 선택 링크이며 FAQ 하위 목록은 진료 영역·세부 질환 탐색을 제공한다.

상세 본문은 AVCD 참고 글의 Pretendard, 720px 폭, 18px/1.7, 문단 아래 24px를 기준으로 한다. H2/H3/H4는 32/24/20px, 768px 미만에서는 본문 17px와 제목 22/20/18px다. 목록·강조·기울임·인용·코드·표는 `article-reading.css`에 모은다. 복사한 제목의 고정 크기 마크도 반응형 제목 위계를 따르며 일반 문단의 명시적 서식은 유지한다.

FAQ 상세는 제목·핵심 답변·상세 답변·병원 관점을 동일한 720px 기사 폭에 정렬한다. 본문만 좁게 가운데 배치해 섹션 제목과 시작선이 어긋나지 않게 한다.

목차는 데스크톱에서 헤더 아래에 고정하고 모바일은 접이식으로 고정한다. 조상 `#subContainer`의 overflow는 clip을 사용해 sticky의 스크롤 기준이 화면으로 유지되게 한다.

참고: https://avcd.kr/blog/seo/seo-geo-homepage-production-guide

블로그·후기 목록의 상단은 공통 `ArchiveToolbar`·`ArchiveTabs`로 구성한다. 카테고리 탭은 왼쪽, 검색·건수는 같은 줄 오른쪽이며 좁은 화면에서 검색을 펼칠 때만 다음 줄을 사용한다. 하단은 공통 페이지네이션과 안내 박스를 쓴다. 후기 검색은 분류를 유지하며 검색 해제는 첫 페이지로 돌아간다.

블로그 행의 오른쪽은 날짜 위·글쓴이 아래로 배치하고 이름은 일반 글자색을 사용한다. 카테고리는 작은 배지이며 클릭·hover 밑줄을 유지한다. 후기 상세도 제목·이미지·본문을 720px로 맞추고, 본문 이미지는 읽기 폭까지 표시한다. HTML·Tiptap 이미지는 클릭·키보드로 확대하며 2배 확대·Esc·닫기·포커스 복귀를 제공한다. 이미 링크가 있는 이미지는 원래 동작을 유지한다.

상세의 카테고리 배지는 해당 분류 목록으로 연결한다. FAQ 질문 성격도 선택된 필터 목록으로 연결한다. 블로그·후기 상세 하단은 공통 `ArticleNavigation`을 사용해 이전글·목록·다음글을 좌·중·우에 둔다. 호버 시 위치를 움직이지 않으며 색상·밑줄만 전환한다. 블로그는 같은 카테고리의 발행순으로 이동한다. 안내 문구 14px, 제목 16px/1.6이며 모바일에서도 세 칸을 유지하고 제목은 14px 두 줄 말줄임표로 표시한다.

블로그 상세는 제목 아래 같은 줄에서 왼쪽에 카테고리 배지, 오른쪽에 이름·날짜를 배치한다. 좁은 화면에서 공간이 부족할 때만 줄을 나눈다.
