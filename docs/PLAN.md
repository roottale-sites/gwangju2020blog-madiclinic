# 광주 Dr.이 마디클리닉 블로그 사이트 설계

- 작성: 2026-09-14
- 상태: 설계 확정 대기(사용자 검토 후 Opus 구현)
- 대상: `https://gwangju2020blog.madiclinic.co.kr` (이 저장소, Vercel 프로젝트 `gwangju2020blog-madiclinic`)
- 원본 참조
  - 기능: `~/workspace/projects/clients/headnerve` (맥락한의원, Next.js 16 + RootTale CMS)의 `/column`·`/reviews`·`/faq`
  - 헤더: `http://gwangju2020.madiclinic.co.kr/` 헤더를 1px 단위로 동일 재현. 추출 원본은 `docs/assets/madiclinic-header/`
  - 디자인 토큰·로고·파비콘: 본 사이트 CSS·이미지에서 실측 추출. 계약은 `docs/DESIGN.md`, 자산은 `docs/assets/madiclinic-brand/`

## 1. 요구사항과 완료 조건

사용자 확인 사항(2026-09-14):

1. headnerve에서 가져오는 것은 칼럼·치료후기·FAQ 세 기능만이다. 질환 페이지·소개·홈 등은 가져오지 않는다.
2. RootTale CMS(ROOT-ADMIN) 테넌트·사이트를 새로 만들고 콘텐츠는 거기서 작성한다. 기존 글 이관은 없다.
3. 헤더는 본 사이트와 동일하게 두고, 기존 GNB 메뉴는 본 사이트 절대주소로 연결하며 블로그 메뉴(칼럼·치료후기·FAQ)를 같은 스타일로 GNB에 추가한다.
4. 기술 스택은 headnerve와 같은 Next.js + Vercel이다.
5. 세 기능의 구조(라우트·카테고리 계층·FAQ 4단계·검색·페이지네이션·RSS·사이트맵·미리보기·웹훅)는 headnerve 그대로 가져온다. 다만 분류 값(카테고리 이름·slug)은 설계에서 미리 정하지 않고 ROOT-ADMIN에서 만든다. 코드는 분류를 하드코딩하지 않는다.
6. 디자인 토큰(색·글꼴·간격·모양)과 로고·파비콘은 마디의원 홈페이지에서 추출한 값만 쓴다.

완료 조건:

- `/column`, `/column/{category}`, `/column/{category}/{slug}`, `/reviews`, `/reviews/{slug}`, `/faq`, `/faq/{section}`, `/faq/{section}/{topic}`, `/faq/{section}/{topic}/{slug}`가 새 ROOT-ADMIN 사이트의 발행 글과 분류를 서버 렌더링한다.
- 헤더가 1440·1220·980·768·390px에서 본 사이트와 픽셀 일치한다.
- 사이트맵 인덱스·RSS·robots·서명 웹훅 재검증이 동작한다.
- typecheck·vitest·production build·Playwright(칼럼·후기·FAQ·사이트맵)가 통과하고 Aside 실브라우저로 3개 폭을 확인한다.

## 2. 사이트 구조

### 2.1 URL

| URL | 화면 | 출처 |
|---|---|---|
| `/` | `/column`으로 301 | 사용자 결정(2026-09-23). 커뮤니티 전용 서브도메인의 루트는 칼럼 목록으로 연결한다 |
| `/column` | 칼럼 목록(검색·페이지네이션) | headnerve `ColumnArchive` |
| `/column/{category}` | 카테고리 목록 | headnerve `ColumnCategoryPage` |
| `/column/{category}/{slug}` | 칼럼 상세(TOC·병원 안내·면책) | headnerve `ColumnDetailRoute` |
| `/column/rss.xml`, `/column-sitemap.xml` | 피드·사이트맵 | headnerve |
| `/reviews`, `/reviews/{slug}` | 치료후기 목록·상세 | headnerve `reviews` |
| `/reviews/rss.xml`, `/reviews-sitemap.xml` | 피드·사이트맵 | headnerve |
| `/faq` | 질문 홈(진료 영역 카드) | headnerve `FaqHomePage` |
| `/faq/{section}` | 진료 영역 목록 | headnerve `FaqSectionPage` |
| `/faq/{section}/{topic}` | 세부 질환 목록 | headnerve `FaqTopicPage` |
| `/faq/{section}/{topic}/{slug}` | 답변 상세(`FAQPage` JSON-LD) | headnerve `FaqDetailPage` |
| `/faq-sitemap.xml`, `/sitemap.xml`, `/sitemap-static.xml`, `/robots.txt` | SEO | headnerve, 정적 목록만 교체 |
| `/api/revalidate` | ROOT-ADMIN 서명 웹훅 | headnerve |
| `/api/exposures` | 커뮤니티 첫 화면의 팝업 조회 | headnerve와 같은 공용 런타임, `cms/exposure-slots.json` |
| `/preview/post/{id}` | ROOT-ADMIN 초안 미리보기(noindex) | headnerve |
| 존재하지 않는 경로 | 공통 404 안내·커뮤니티·병원 바로가기 | headnerve 404 구성을 마디클리닉 토큰으로 적용. 없는 후기도 같은 디자인 사용 |

세 기능에 속하지 않아 가져오지 않는 headnerve 라우트: `/qa`·`/blog`·`/bbs` 등 옛 게시판 410 스텁, `/about`과 질환 페이지(`/headache` 등), 디자인 시스템 카탈로그, 다국어 라우트. 세 기능의 라우트·구성 요소는 전부 가져온다. 사용자 요청(2026-09-23)으로 팝업을 추가하며 CMS 홍보 배너 슬롯은 두지 않는다. ROOT-ADMIN에서도 CMS 배너 메뉴만 숨기고, 페이지 상단 사진 배너는 유지한다. 연결 계약과 운영 반영 항목은 [ROOT-ADMIN 연동 문서](root-admin-integration.md)를 따른다.

ROOT-ADMIN 팝업 미리보기의 루트 iframe 요청은 `/column`으로 307 이동한다. 일반 방문자의 `/`는 같은 주소로 301 이동한다.

### 2.2 페이지 골격

커뮤니티 페이지는 같은 골격을 쓴다. 헤더·푸터와 ROOT-ADMIN 팝업은 루트 `SiteLayout`에서 유지하고, `MadiPageFrame`은 배너·하위 메뉴·위치 표시줄·본문만 교체한다. 커뮤니티 내부 메뉴·목록·상세·페이지 이동은 `next/link`, 블로그 검색은 `next/form`을 사용해 문서를 다시 불러오지 않는다. 원본 사이트 주소로 이동할 때는 정상적인 문서 전환을 유지한다.

404는 `MadiNotFound`가 오류 안내와 바로가기를 한 화면으로 제공한다. 공통 헤더·푸터는 유지하고, 서브 배너 대신 본문 위에 `--madi-header-h`만큼 여백을 더해 고정 헤더에 가리지 않게 한다. CMS 조회 없이 렌더하며 `noindex, follow`를 적용한다.

```
<MadiHeader />                 본 사이트 헤더 재현(§3), position fixed 140px
<MadiSubVisual title="칼럼" />  본 사이트 서브 배너 문법(subStyle.css #bnSubArea) 재현. 높이 300px, padding-top 140px으로 고정 헤더 아래 본문이 시작
<MadiCommunityNav />           본 사이트 배너 하단 메뉴 문법으로 블로그·자주 묻는 질문·후기 이동
<MadiBreadcrumb />             본 사이트 .whereIsLine 문법(60px 띠)·메뉴 펼침 + BreadcrumbJsonLd
<main>…headnerve 목록/상세 본문(DESIGN.md §5 문법으로 스타일)…</main>
<MadiFooter />                 본 사이트 #bottom 구조·문구 재현(사업자 정보·저작권)
```

- headnerve의 `SiteHeader`·`SitePageHero`·`FinalCta`·`DiseaseClosing`(브레드크럼+푸터)·`SiteClosing`(지도)·`FloatingQuickMenu`·`SiteExposures`는 쓰지 않는다. 그 자리에 위 세 컴포넌트를 둔다.
- 커뮤니티는 별도 사이트가 아닌 본 사이트의 한 메뉴처럼 이어진다. GNB의 현재 메뉴는 원본 `fix` 표시를 유지하고, 위치 표시줄의 첫 두 칸에서 전체 메뉴·커뮤니티 하위 메뉴를 연다. CMS 상세 경로는 상위 링크로 유지한다. 기존 진료 메뉴·홈·로고는 본 사이트로, 커뮤니티 세 화면은 이 저장소로 같은 탭에서 이동한다.
- 서브 배너 배경은 `docs/assets/madiclinic-brand/sub-banner/sbn01~05.jpg`(2000×360)에서 칼럼 01, 후기 02, FAQ 03을 쓴다.
- 색·글꼴·간격·모양은 `docs/DESIGN.md`의 토큰만 쓴다. headnerve CSS를 옮길 때 `--figma-*`와 하드코딩 색은 전부 `--madi-*`로 바꾼다.

## 3. 헤더 재현 계약

정본은 `docs/assets/madiclinic-header/`의 `header.html`(마크업), `header.css`(baseStyle.css에서 헤더 관련 규칙만 값 무변경 추출), `header-behavior.js`(jQuery 동작 참고), `img/`(아이콘·로고 10개)이다. 구현은 값을 새로 재지 않고 이 파일을 옮긴다.

### 3.1 구조와 치수(데스크톱, >980px)

| 요소 | 규칙 |
|---|---|
| `#header` | `position: fixed; top: 0; height: 140px; z-index: 999` |
| `.headerFix` | 높이 140px, 배경 `#fff`, `box-shadow: 0 1px 3px 2px rgba(0,0,0,.1)`, 첫 로드에 `.slideanim4 → .slideDown`(1.0s, translateY(-60px)→0) |
| `.topLineArea` | 높이 40px, 배경 `#e5e5e5`, `border-bottom: 1px #eee` |
| `.topLineBox` | `max-width: 1200px` 중앙 |
| `ul.contact` | 좌측 360px, 배경 `#cecece`, 항목 80/80/100/100px, 글자 13px `#fff`, `.on`·hover 배경 `#2e60a1`. 4번째(광주 Dr.이 마디)가 `.on` |
| `ul.topLink` | 우측 200px, 40×40 아이콘 5개(홈·네이버예약·카카오·인스타·유튜브), `background-size: 90%`, hover `rgba(46,96,161,.7)` |
| `.naviArea` | `max-width: 1200px; height: 100px` |
| `h1.ci` | 좌측 240×100, `padding: 20px 0`, 로고 `hi_gwangju2020_20240826.png`(240×60) |
| `ul.menuNavi` | `position: absolute; right: 220px; height: 100px`, 항목 폭 120px(4번째 160px), 글자 18px/500 `#555`, hover·`.on` `#000`, `.menuLine` 60×1px `rgba(89,113,176,.6)` |
| `ul.subMenu` | `top: 80px`, 배경 `rgba(145,37,195,.8)`, `padding: 20px 0`, 항목 14px `#fff`, hover `rgba(0,0,0,.3)` |
| `.officialWeb` | 우측 200×40, `top: 30px`, 둥근 버튼 `#08539d`, 아이콘 34px 원 |
| 폰트 | `'Noto Sans KR'` 100~900 `@font-face`(fonts.gstatic.com/ea/notosanskr/v2). 같은 파일을 그대로 선언해 렌더 차이를 없앤다. Pretendard·Noto Serif KR은 헤더에 쓰지 않는다 |

### 3.2 반응형

- `≤1220px`: `.officialWeb { right: 10px; width: 190px }`만 적용(원본에서 GNB 축소 규칙은 주석 처리돼 있음).
- `≤980px`: 헤더 120px, `.naviArea` 80px, 로고 160×80(`left: 10px`), `#naviToggle`(60px 원, 3선 애니메이션) 표시, GNB·topLink·officialWeb은 우측 드로어(폭 270px)로 전환. `.mobileHome`은 드로어 상단 80px 영역(로고 `mobileHi_gwangju2020_20240826.png`). `#naviBlack` 딤 `rgba(0,0,0,.8)`.
- `≤420px`: `ul.contact` 320px, 항목 70/70/90/90px, 12px.
- 원본이 참조하는 `bgMobileNavi.png`·`naviToggle.png`는 서버에서 302로 사라진 상태다. 원본과 같게 배경색만 남긴다(이미지 복구 시도 안 함).

### 3.3 동작(jQuery 제거, 같은 결과)

`header-behavior.js`의 동작을 React 클라이언트 컴포넌트 1개(`MadiHeaderBehavior`)로 옮긴다.

- 데스크톱: `li > a`에 `mouseenter`/`focusin`이면 해당 `li.on` + `ul.subMenu` 펼침, `.menuNavi` `mouseleave`면 모두 접기. jQuery `slideDown('fast')`는 200ms height 전환으로 맞춘다.
- 모바일: `#naviToggle` 클릭으로 `.line-top/mid/bot` ↔ `*-reverse` 클래스 토글, `body overflow hidden`, `.mobileHome`·`.menuNavi`·`ul.topLink`·`.officialWeb`의 `right`를 `-320px`→`0`으로. 1차 메뉴 클릭은 하위 접기/펼치기, `.subNone`은 이동.
- 폭 전환(980px)마다 PC/MO 스크립트가 상태를 초기화하는 원본 동작을 `matchMedia` 리스너로 재현한다.
- 헤더 첫 등장 `.slideDown`은 CSS 클래스만으로 처리(스크롤 감시 불필요).

### 3.4 GNB 메뉴 구성(추가 메뉴 결정)

기존 4개는 유지하고 본 사이트 절대주소로 연결한다. 블로그 항목은 본 사이트가 2026-09-15에 직접 추가한 5번째 1차 메뉴 `커뮤니티`와 같은 라벨·순서로 둔다(본 사이트 쪽 하위 링크는 아직 `#`).

| 1차 | 링크 | 2차 |
|---|---|---|
| 원장 소개 | `http://gwangju2020.madiclinic.co.kr/doctor/doctor01.html` | 인사말, 프로필 |
| 병원 소개 | `…/about/about01.html` | 시설 소개, 오시는 길 |
| 진료 안내 | `…/clinic/clinic01.html` | 진료 안내, 비급여 항목 |
| 비수술 중점치료 | `…/special/special01.html` | 인대증식술, ESWT, 신경차단술, 도수치료, IVNT |
| 커뮤니티 | `/column` | 블로그 `/column`, 자주 묻는 질문 `/faq`, 후기 `/reviews` |

본 사이트가 5번째 메뉴를 넣으며 GNB 치수를 바꿨다(항목 120→95px, 4번째 160→140px, 글자 18→17px, 자간 -0.02em). `docs/assets/madiclinic-header/`는 2026-09-15 현행으로 재추출했고 그 값을 그대로 쓴다. 현재 페이지가 블로그면 `커뮤니티 li`에 `.on`, 하위 현재 항목에 `.on`을 준다. `ul.contact`는 4번째 `광주 Dr.이 마디`를 `.on`으로 유지한다.

## 4. CMS(ROOT-ADMIN) 계약

### 4.1 프로비저닝

| 단계 | 방법 |
|---|---|
| 테넌트·사이트 생성 | ROOT-ADMIN `/manage/{tenantSlug}/sites/new`. 제안 slug `madiclinic-gwangju2020`, 도메인 `gwangju2020blog.madiclinic.co.kr` |
| 콘텐츠 모델 동기화 | 플랫폼 저장소에서 `pnpm --filter @roottale/database content-model:sync -- --site-slug madiclinic-gwangju2020 --contract <이 저장소>/cms/content-models.json` (dry-run 후 `--apply`) |
| API 키 | `/site/{slug}/settings/api-keys`에서 사이트 범위 공개 읽기 키 1개 발급 → Vercel 민감 환경변수 `ROOTTALE_API_KEY`. 코드·문서에 기록 금지 |
| 웹훅 | `/site/{slug}/settings/webhooks` → `https://gwangju2020blog.madiclinic.co.kr/api/revalidate`(ES256 서명은 cms-client가 검증) |
| 작성자 프로필 | 이경무 대표원장 1명 |

`add-tenant` 스킬은 `roottale init` CLI 시대 절차라 이번에는 참고만 한다. 위 ROOT-ADMIN 화면 절차가 headnerve ADR-0006 §9와 같은 현행 방식이다.

### 4.2 콘텐츠 모델(`cms/content-models.json`)

headnerve 선언을 그대로 쓴다. 분류 목록만 비운다.

| 모델 | 표시(headnerve와 동일) | 분류 |
|---|---|---|
| `column` | `category_tree`, `basePath: /column`, `categoryDepth: 1`, `categoryCardinality: exactly-one`, feed·og | `categories: []`. ROOT-ADMIN에서 1단계 분류를 만든다. 글마다 정확히 1개 |
| `reviews` | `detail`, `/reviews/:slug`, 커스텀 필드 `patient_name`·`doctor_name`·`treatment_period`(ADR-0001) | 없음 |
| `faq` | `category_tree`, `basePath: /faq`, `categoryDepth: 2`, 필드 `clinic_perspective`(라벨 "마디클리닉 관점") | `categories: []`. ROOT-ADMIN에서 진료 영역(1단계)→세부 질환(2단계)을 만든다. 글마다 2단계 말단 분류 정확히 1개 |

분류 값은 이 설계에서 정하지 않는다. 화면·URL·사이트맵은 CMS 공개 API의 분류(`/v1/cms/public/categories`, `content-models`)만 읽어 만들고 코드에는 slug를 두지 않는다. headnerve에서 정적 분류 원장 역할을 하던 `column-category-manifest.json`·`faq-registry.ts`의 질환 트리는 CMS 조회로 대체한다.

### 4.3 환경 변수

`ROOTTALE_API_KEY`(민감), `ROOTTALE_API_BASE=https://api.roottale.com`, `ROOTTALE_MEDIA_ORIGIN=https://root-cdn.com`, `NEXT_PUBLIC_ROOTTALE_SITE_ID`, `NEXT_DEV_ALLOWED_ORIGINS`(로컬). `.env.example`에 키 이름만 둔다.

## 5. headnerve 포트 계획

### 5.1 그대로 복사(범용 인프라)

- `src/features/cms/{tiptap-body,cf-image-url,body-image,content-text,internal-content-links,revalidation}.ts` (+ 테스트). `raw-html.ts`는 `LEGACY_CONTENT_ORIGIN`을 제거한다.
- `src/features/seo/{sitemap-xml,rss-xml,preview-noindex,site-sitemap}.ts`
- `src/components/site/{JsonLd,SiteLayout,SkipLink,SiteBreadcrumb,BreadcrumbJsonLd}.tsx`
- `src/features/column/{column-cache,column-pagination,column-search,column-document,column-wire,column-rss,column-sitemap}.ts`, `ColumnTableOfContents.tsx`, `ColumnArchiveSearch.tsx`, `ColumnCategoryNav.tsx`, `ColumnCategoryPage.tsx`
- `src/features/reviews/{review-cache,review-api,review-body,review-faq,review-rss,review-sitemap}.ts`, `ReviewFaq.tsx`
- `src/features/faq/{faq-cache,faq-wire,faq-model,faq-api,faq-source,faq-sitemap,faq-revalidation,faq-detail-outline,faq-import,faq-sheet-import}.ts`, `FaqPageFrame.tsx`, `FaqHomePage/FaqSectionPage/FaqTopicPage/FaqDetailPage/FaqShared.tsx`(문구·이미지만 교체)
- `src/app/api/revalidate/route.ts`, 사이트맵·RSS 라우트 5개, `src/app/preview/post/[id]`, `public/sitemap.xsl`
- `scripts/{faq-cms-api,import-faq-sheet,sync-faq-content}.ts`(FAQ 시트 가져오기 파이프라인. 데이터만 새 테넌트용)

### 5.2 복사 후 브랜드 교체

| 파일 | 변경 |
|---|---|
| `src/data/site.ts` | `siteOrigin = 'https://gwangju2020blog.madiclinic.co.kr'` |
| `src/data/clinic.ts` | 광주 남구 마디클리닉. 사업자 322-91-01246, 대표원장 이경무, 광주광역시 남구 독립로 14 1~3F, TEL 062-675-0750, FAX 062-675-0760, madi2020@naver.com |
| `src/data/nav.ts` | 네이버예약 `https://m.booking.naver.com/booking/13/bizes/823238`, 카카오 `http://pf.kakao.com/_YIYSxj`, 인스타 `madiclinic2020`, 유튜브 `@practicalpainmanagementwit8115`, GNB 트리(§3.4). `cafeUrl`은 없음 → `ContentCafeLink`는 제거 |
| `src/features/seo/schema.ts` | `siteEntityJsonLd`를 MedicalClinic(마디클리닉)+Physician(이경무)로 |
| `src/app/layout.tsx` | 제목·설명·파비콘(`docs/assets/madiclinic-brand/favicon/` 세트를 `app/`으로)·OG 이미지(헤더 로고 1200×630 생성). GTM·서치콘솔·네이버 인증 토큰은 발급 후 삽입, 없으면 비움 |
| `src/features/column/column-model.ts`, `column-content.ts`, `column-category.ts`, `column-source.ts` | 88건 JSON 폴백·`legacy-column-list-excerpts`·`DISEASE_LINK_RULES`·manifest(88건 단정) 제거. 카테고리 목록·SEO 제목은 CMS 분류 API에서 읽는다. 실패 시 빈 목록+오류 상태 |
| `ColumnDetailRoute.tsx`, `ColumnCategoryPage.tsx`, `ColumnArchiveRow.tsx` | 바이라인 "마디클리닉 이경무 원장", 로고 대체 이미지, 라벨 "칼럼" |
| `review-model.ts`, `ReviewCard.tsx` | 로고 대체 이미지, 대표원장 판별 |
| `src/features/faq/faq-model.ts`, `faq-registry.ts` | `FAQ_SECTION_SLUGS` 상수와 headnerve 질환 콘텐츠 import를 걷어내고 영역·질환 트리를 CMS 모델·분류에서 읽는다. `fallbackFaqArchive`는 빈 원장. 4단계 경로 계산·JSON-LD·사이트맵 로직은 그대로 |
| `FaqHomePage/FaqSectionPage/FaqTopicPage/FaqDetailPage/FaqShared.tsx` | 문구·영역 카드 이미지·의사 사진 교체, 카페 카드 제거. 화면 구조는 유지 |
| `src/features/clinic-guide/*` | `clinic-guide-body.json`을 마디클리닉 진료 안내로 새로 작성(전화·네이버예약·카카오 버튼 3개, 색 `#08539d`·`#2e60a1`) |
| `src/styles/*` | `site.css` 배럴 + `column.css`·`reviews.css`·`review-detail.css`·`review-faq.css`·`faq*.css`·`post-pattern.css` 유지. `tokens.css`는 `docs/DESIGN.md` §7 그대로. 각 시트의 `--figma-*`·하드코딩 색·Pretendard를 `--madi-*`·Noto Sans KR로 치환. `figma-*`·`home`·`about`·`disease*`·`ds/` 삭제. 13개 `*-contract.test.ts`는 삭제하고 `tokens.css`가 DESIGN.md 값과 일치하는지 검사하는 테스트 1개로 대체 |
| `next.config.ts` | `images.formats`·`reactStrictMode`·`allowedDevOrigins` 유지, 루트는 `/column`으로 일반 방문 301·팝업 iframe 307 |
| `src/app/robots.ts`, `sitemap-static.xml` | 새 호스트·정적 페이지 목록(`/column`, `/reviews`, `/faq`) |
| `tests/{column-list,column-detail,reviews,sitemap,seo-schema}.spec.ts` | 셀렉터·canonical·slug 재작성. 사이트맵 자식 4개 기준 |

### 5.3 남기는 것

headnerve 고유 데이터만 남긴다(구조·화면 코드는 모두 가져온다): `column-articles.json`(942KB, 88건 본문)·`column-category-manifest.json`·`column-redirect-alias-manifest.json`·`legacy-column-list-excerpts.ts`·`column-redirects.ts`(옛 URL 301 표), headnerve 콘텐츠를 단정하는 테스트 12개(§5.2에서 새 데이터 기준으로 다시 씀), `features/{disease,headache,about,policy,legacy}`, `src/design-system`, 다국어·410 라우트, `pnpm-workspace.yaml`(존재하지 않는 패치 참조), headnerve 이미지 자산 전부. `features/exposures`는 이 사이트의 팝업 슬롯으로 구성한다.

### 5.4 패키지

`@roottale/cms-client`·`cms-core`·`cms-renderer-next`는 0.64.0 이상으로 고정하고 `patchedDependencies`는 쓰지 않는다. Next 16, React 19, pnpm 10, Node 22. `sanitize-html`, `htmlparser2`, `domhandler`(시트 가져오기용) 유지. `@roottale/analytics-runtime` 0.6.1을 ROOT-ADMIN 사이트 설정과 연결한다. 클릭과 유입 정보의 연결 계약은 [ANALYTICS.md](ANALYTICS.md)를 따른다.

## 6. 구현 순서(Opus 작업 단위)

각 단위는 typecheck·관련 vitest 통과 후 `type(scope): 한글 설명` 형식으로 로컬 커밋한다. 운영 배포(Vercel main push)는 사용자 승인 후에만 한다.

1. **scaffold**: `index.html` 제거, Next.js 16 앱 생성, tsconfig·vitest·playwright 설정, `.env.example`, `docs/TODO.md`. `/`→`/column` 301.
2. **header**: `src/components/madi/MadiHeader.tsx` + `MadiHeaderBehavior.tsx`(client) + `src/styles/madi/header.css`(`docs/assets/madiclinic-header/header.css` 그대로, 이미지 경로만 `/madi/img/`) + `public/madi/img/*`(헤더 아이콘·`madiclinic-brand` 로고 3종) + Noto Sans KR `@font-face`. 검증: Aside로 본 사이트와 새 사이트를 1440·1220·980·768·390px에서 헤더 영역 캡처 후 픽셀 diff(§3.4 허용 차이 외 0). 드롭다운·드로어 동작 확인.
3. **shell**: `tokens.css`(DESIGN.md §7), `MadiSubVisual`, `MadiBreadcrumb`, `MadiFooter`(본 사이트 `#bottom` 재현), `data/{site,clinic,nav}.ts`, `seo/schema.ts`, `layout.tsx`, 파비콘·OG. DESIGN.md §5 문법을 `src/styles/madi/patterns.css`로.
4. **cms-infra**: `features/cms/*`, `features/seo/*`, `api/revalidate`, `preview`, `cms/content-models.json`(§4.2).
5. **column**: 목록·카테고리·상세·검색 포트, 브랜드 교체, 테스트 재작성. 로컬 목 CMS(headnerve 테스트 픽스처 방식)로 목록·상세·검색·RSS·사이트맵 확인.
6. **reviews**: 동일.
7. **faq**: 4단계 화면 포트. `faq-registry`를 CMS 분류 기반으로 재작성. 분류 0건·모델 없음(`no-model`)·API 장애 상태에서 빈 화면이 아닌 안내 문구가 나오는지 확인.
8. **seo**: `sitemap.xml` 인덱스·`sitemap-static.xml`·robots·JSON-LD·metadata 표(`docs/metadata-table.md`).
   각 단계의 화면 결과는 `docs/DESIGN.md` 토큰과 §5 문법에 맞는지 Aside 캡처로 확인한다.
9. **provision**(사용자 참여): ROOT-ADMIN 사이트 생성 → 모델 동기화 → API 키 Vercel 등록 → 웹훅 등록 → 글 1건씩 발행해 실데이터 확인.
10. **release**: Playwright, production build, Aside 3폭 확인, `docs/TODO.md`·llm-wiki 기록. 승인 후 main push·배포.

## 7. 검증 계획

| 항목 | 방법 |
|---|---|
| 헤더 픽셀 일치 | Aside 캡처 → 원본 vs 구현 diff. 허용 차이: 폰트 안티앨리어싱, §3.4 GNB 가로 이동 |
| 헤더 동작 | PC hover 드롭다운, 980px 이하 드로어 열기/닫기, 폭 전환 시 상태 초기화, 키보드 포커스 |
| 기능 | vitest(포트한 계약 테스트 + 재작성 테스트), Playwright 5개 spec |
| CMS | 서명 웹훅 401/422/200, 발행→`/column` 갱신 60초 이내, `no-model`·API 장애 시 안전 응답 |
| 배포 | `pnpm build`(typecheck 포함), Vercel Preview URL에서 3폭 확인 |

## 8. 미결 사항(구현 병행 가능)

1. 칼럼 1단계 분류와 FAQ 진료 영역·세부 질환 분류의 이름·slug. 설계에서 정하지 않으며 ROOT-ADMIN에서 만든다. 분류가 0건이면 칼럼 글을 발행할 수 없고(`exactly-one`) FAQ 화면은 비어 있으므로, 9단계 프로비저닝 때 최소 1세트는 만들어야 한다.
2. GTM·Google/Naver 서치콘솔 인증 토큰, ROOT-ANALYTICS 사이트 ID 발급 여부.
3. 치료후기 의료광고 심의 문구(headnerve `reviews`의 치료경험담 고지 문구를 마디클리닉 기준으로 검토).
4. 본 사이트 GNB에 블로그 링크를 역으로 추가할지(본 사이트는 이 저장소 범위 밖).
5. 로고 벡터 원본 확보 여부(현재 PNG 240×60만 있어 고해상도 화면에서 흐릿함. 헤더 1px 재현에는 원본 PNG를 그대로 쓴다).
