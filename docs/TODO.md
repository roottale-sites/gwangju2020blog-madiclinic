# 작업 목록 — 광주 Dr.이 마디클리닉 블로그

정본 설계: `docs/PLAN.md`, 디자인 토큰: `docs/DESIGN.md`.
단계 정의는 PLAN.md §6을 따른다. 각 단계는 typecheck·관련 vitest 통과 후 로컬 커밋한다.

## 구현 단계 (PLAN.md §6)

- [x] 1. **scaffold** — `index.html` 제거, Next.js 16 앱 생성, tsconfig·vitest·playwright 설정, `.env.example`, `docs/TODO.md`, `/`→`/column` 301
- [x] 2. **header** — `MadiHeader.tsx`·`MadiHeaderBehavior.tsx`·`styles/madi/header.css`·`public/madi/img/*`·Noto Sans KR `@font-face`. 본 사이트와 5폭 픽셀 diff
- [x] 3. **shell** — `tokens.css`, `MadiSubVisual`, `MadiBreadcrumb`, `MadiFooter`, `data/{site,clinic,nav}.ts`, `seo/schema.ts`, `layout.tsx`, 파비콘·OG, `styles/madi/patterns.css`
- [x] 4. **cms-infra** — `features/cms/*`, `features/seo/*`, `api/revalidate`, `preview`, `cms/content-models.json`(PLAN §4.2)
- [x] 5. **column** — 목록·카테고리·상세·검색 포트, 브랜드 교체, 테스트 재작성
- [x] 6. **reviews** — 목록·상세 포트
- [x] 7. **faq** — 4단계 화면 포트, `faq-registry`를 CMS 분류 기반으로 재작성
- [x] 8. **seo** — `sitemap.xml` 인덱스·`sitemap-static.xml`·robots·JSON-LD·`docs/metadata-table.md`
- [x] 9. **provision**(완료, 2026-09-23) — 사용자가 테넌트 생성. Aside로 ROOT-ADMIN 사이트 `gwangju2020-blog-madiclinic`(site id `01a09f2d-1113-7bf4-ab3a-b18e2ef62839`, tenant id `01a09eeb-bd8d-7390-aac8-ddacc5b69b91`) 확인, 웹훅 `https://gwangju2020blog.madiclinic.co.kr/api/revalidate` 등록, 읽기 전용 사이트 키 `vercel-gwangju2020blog` 발급. `content-model:sync --apply` 완료(models faq·column·reviews, fieldGroups 1, categories 0). Vercel env: `ROOTTALE_API_BASE`·`ROOTTALE_MEDIA_ORIGIN`·`NEXT_PUBLIC_ROOTTALE_SITE_ID` 3환경 등록, `vercel.json` framework nextjs.
  - [x] `ROOTTALE_API_KEY` 연결 — 기존 사이트 전용 읽기 키를 재사용해 로컬 `.env.local`과 Vercel Production·Preview·Development에 Secret으로 저장(2026-09-22). 키 원문은 코드·문서·로그에 기록하지 않음.
  - [x] 실제 CMS 조회 — column·faq·reviews 공개 API와 콘텐츠 모델 조회 200. 로컬 목록 3종·RSS 2종·FAQ 사이트맵 200 확인. 칼럼·후기·FAQ 각각 최근 3개 사본을 공개했으며 상세·분류·XML 검증은 [복사 기록](headnerve-copy.md)에 남겼다.
  - [x] 운영 재배포 — 사용자 공개 승인에 따라 반영. 발행·수정 웹훅과 공개 화면 자동 갱신 확인.
  - [x] ROOT-ADMIN 분류 생성 — 복사 원문의 칼럼·후기 분류와 FAQ 영역·질환 구조를 별도로 생성.
  - [x] 글 발행과 관리자 수정 → 실데이터 화면 자동 갱신 확인. FAQ 응답 지연 수정 후 웹훅 2.5초 성공.
- [ ] 10. **release** — Playwright, production build, Aside 3폭 확인, `docs/TODO.md`·llm-wiki 기록. 승인 후 main push·배포

## ROOT-ADMIN 연동 보완 (2026-09-23)

- [x] 칼럼·후기·FAQ 공통 초안 미리보기와 ID 검증, 칼럼 분류별 글 수 캐시 갱신 보완.
- [x] 공용 팝업 런타임·노출 API·슬롯 계약 추가. CMS 홍보 배너는 제외하고 페이지 상단 사진 배너는 유지.
- [x] 운영 공개 조회와 로컬 서버 발행·수정·삭제, Aside 반응형 팝업 동작 검증.
- [x] ROOT-ADMIN 메뉴 분리 기능 배포 후 이 사이트의 `banners` 메뉴만 숨김으로 저장. `popups` 메뉴는 유지.
- [x] 사용자 승인 후 사이트·관리자 배포, 운영 주소·팝업 슬롯·글 미리보기 설정 반영. 실제 PC·모바일 팝업의 미리보기·발행·수정·중지·삭제 확인.
- [x] 운영 검수에서 발견한 팝업 발행 대상 불일치, 글 발행 직후 수정 실패, 삭제 상세 캐시 잔류를 수정·배포. 칼럼·FAQ·치료후기별 초안 미리보기·발행·수정·영구 삭제를 검증하고 임시 글·팝업 정리.

연결 계약·발견 사항·검증 범위·운영 순서: [root-admin-integration.md](root-admin-integration.md). 아래 단계별 결과는 당시의 기록이며 현재 배너·미리보기 동작은 이 문서를 따른다.

## 404와 루트 이동 (2026-09-22)

- [x] `headnerve.com`의 404 구성을 마디클리닉 색상·글꼴로 적용. 공통 헤더·푸터, 블로그·질문·후기 카드, 병원 홈·예약·원장 소개·오시는 길을 연결했다. 없는 후기도 같은 디자인과 전용 문구를 사용한다.
- [x] 당시 사용자 요청에 따라 루트만 병원 홈페이지로 301 이동했다. 2026-09-23 변경된 현행 대상은 `docs/PLAN.md` §2.1을 따른다. Playwright 서버 준비 확인 주소도 로컬 `/column`으로 바꿨다.
- [x] 빌드·관련 단위 테스트, HTTP 상태·검색 제외 메타데이터, Aside에서 데스크톱·태블릿·모바일 화면을 확인했다. 화면 폭은 같은 브라우저의 iframe으로 검사했다.
- [x] 설정 변경 후 기존 `next dev`에서 커뮤니티 세 경로가 모두 404로 응답하는 현상을 재현했다. 개발 경로 타입도 비어 있었으며, 서버를 정상 재시작하자 경로 목록과 세 메뉴가 복구됐다. 운영 사이트와 production build는 정상이다.
- 운영 반영 완료(2026-09-23). 이 변경의 로컬 검증 결과와 캡처는 `~/workspace/output/gwangju2020blog-madiclinic/2026-09-22-not-found/`에 있다.

## 헤더 픽셀 diff 결과 (2026-09-15)

원본 `http://gwangju2020.madiclinic.co.kr/` vs 구현 `/column`(production build).
헤더 영역만 자름(>980px는 0~140px, ≤980px는 0~120px).
캡처·스크립트: `~/workspace/output/gwangju2020blog-madiclinic/2026-09-15-header-diff/`(커밋 제외).

| 폭 | 비교 픽셀 | 차이 픽셀 | 차이>24 | 허용 여부 |
|---|---|---|---|---|
| 1440px | 201,600 | 661 | 529 | 허용 — 전부 5번째 1차 메뉴 라벨 상자(x 1022~1083, y 82~99) |
| 1220px | 170,800 | 661 | 529 | 허용 — 같은 라벨 상자(x 912~973) |
| 980px | 117,600 | 0 | 0 | 일치 |
| 768px | 92,160 | 0 | 0 | 일치 |
| 390px | 46,800 | 0 | 0 | 일치 |

남은 차이는 5번째 1차 메뉴 라벨 하나뿐이다. 본 사이트는 `커뮤니티`, 이 저장소는
본 사이트와 같은 `커뮤니티`(블로그·자주 묻는 질문·후기)로 맞췄다(2026-09-15). 치수·색·간격·위치·라벨 모두 같다.

드롭다운 hover(4·5번째)와 모바일 드로어 열기/하위 펼침/닫기도 캡처해 나란히
비교했다(`cmp-hover5.png`·`cmp-hover4.png`·`cmp-mo-sub.png`). 치수·색·위치가
같고 라벨만 다르다.

### 원본이 설계 이후 바뀐 점

`docs/assets/madiclinic-header/`의 2026-09-14 추출본은 1차 메뉴 4개 기준이었다.
그 뒤 본 사이트가 5번째 `커뮤니티`(→ `gwangju2020blog.madiclinic.co.kr`)를 직접
추가하고 GNB 치수를 줄였다(li 120→95px, 4번째 160→140px, 글자 18→17px,
letter-spacing 0→-0.02em, 5번째 드롭다운 `left:50%`·`width:120px`·`translateX(-50%)`).
구현은 현행 원본 값을 따랐고 `docs/assets/madiclinic-header/`도 2026-09-15 기준으로
다시 추출했다. 그래서 PLAN.md §3.4가 허용 차이로 둔 "GNB 120px 가로 이동"은
발생하지 않는다.

### 결정이 필요한 것

5번째 메뉴는 본 사이트 라벨(`커뮤니티` › 블로그·자주 묻는 질문·후기)로 맞췄다. 남은 헤더 픽셀 차이 없음.

## 3단계 shell 확인 (2026-09-15)

`MadiHeader → MadiSubVisual → MadiBreadcrumb → <main> → MadiFooter` 골격을
`MadiPageFrame`으로 묶고 `/column`·`/reviews`·`/faq`에 적용했다. 실브라우저 측정:

| 폭 | 헤더 | 서브 배너 | 배너 제목 y | 브레드크럼 | main | 본문 가림 |
|---|---|---|---|---|---|---|
| 1440px | 0~140 | 0~300 (padding-top 140) | 180 | 300~360 | 360~ | 없음 |
| 390px | 0~120 | 0~200 (padding-top 120) | 140 | 200~260 | 260~ | 없음 |

본 사이트 서브 페이지(`/doctor/doctor01.html`)와 부분 비교(차이>24 픽셀):

| 부분 | 폭 | 차이 픽셀 | 비고 |
|---|---|---|---|
| 서브 배너 | 1440 | 2,669 / 432,000 | 제목 글자 상자(칼럼 vs 원장 소개)만 |
| 서브 배너 | 390 | 1,655 / 78,000 | 같음 |
| 브레드크럼 | 1440·390 | 라벨만 | 칸·홈 아이콘·화살표·색 동일 |
| 푸터 | 1440 | 2,797 / 472,320 | 아래 항목 참고 |
| 푸터 | 390 | 6,272 / 136,890 | 같음 |

푸터 차이는 본 사이트의 `.nabyArea`(제작사 크레딧 띠·관리자 로그인, 1440에서
60px)를 옮기지 않아 `#bottom` 높이가 388→328px로 줄고 `background-size: cover`
배경이 다르게 잘린 것이다. 메뉴 띠·로고·사업자 정보·저작권은 같다.

## 4단계 cms-infra 결과 (2026-09-15)

headnerve에서 가져온 것:

- `src/features/cms/{tiptap-body,cf-image-url,body-image,content-text,internal-content-links,revalidation,raw-html}.ts`(+테스트 6개)
- `src/features/seo/{sitemap-xml,rss-xml,preview-noindex,site-sitemap,static-sitemap}.ts`(+테스트 3개)
- `src/components/site/{SiteBreadcrumb,BreadcrumbJsonLd}.tsx`(`JsonLd`는 3단계 것 유지)
- `src/app/api/revalidate/route.ts`(+`route.test.ts`·`route-signature.test.ts`), `src/proxy.ts`, `public/sitemap.xsl`, `scripts/faq-cms-api.ts`
- `src/features/{column/column-cache,reviews/review-cache,faq/faq-cache}.ts`(재검증이 세 컬렉션을 한 표로 다뤄 먼저 필요)
- `cms/content-models.json`: 세 모델 `categories: []`, 라벨·안내 문구의 "맥락한의원 관점" → "마디클리닉 관점"

headnerve와 다르게 한 것:

- `raw-html.ts`: `LEGACY_CONTENT_ORIGIN`(이관 원본 사이트) 제거. 자기 배포 origin의 절대
  링크만 상대 경로로 바꾼다. 이관 콘텐츠가 없어 `LEGACY_IMPORTED_IMAGE_ORIGINS`
  (iCRM·Pexels)와 `trustedImportedImageUrl`도 함께 제거해 가져오기 경로가 일반 본문과
  같은 이미지 origin 정책을 쓴다.
- `features/faq/faq-cache.ts`에 `faqInternalLinkKeyFromPath`를 둔다. headnerve는 이 계산을
  `faq-model.ts`에서 정적 진료 영역 목록(`FAQ_SECTION_SLUGS`)으로 걸렀는데, 코드에 분류를
  두지 않는다는 PLAN.md §4.2 때문에 경로 형태만 본다.
- `api/revalidate/route.ts`에서 FAQ 역참조 무효화(`affectedFaqDetailPaths` + `resolveFaqArchive`)
  블록은 7단계로 미뤘다(FAQ 원장이 있어야 계산된다). 자리와 이유를 주석으로 남겼다.
- `src/app/preview/post/[id]/page.tsx`는 `ColumnPreviewRoute`에 의존해 5단계에서 넣었다.
- `static-sitemap.ts`의 정적 목록은 `/column`·`/reviews`·`/faq` 세 개다(PLAN.md §5.2).

검증: `pnpm typecheck` 통과, `pnpm test` 13파일 116케이스 통과, `pnpm build` 통과
(`ƒ Proxy (Middleware)` 등록 확인).

## 5단계 column 결과 (2026-09-15)

라우트: `/column`, `/column/{category}`, `/column/{category}/{slug}`,
`/column/rss.xml`, `/column-sitemap.xml`, `/preview/post/{id}`(4단계에서 미뤘던 것).
화면은 모두 `MadiPageFrame`(배너 01, 제목 "블로그") 안이다.

headnerve와 다르게 한 것:

- `column-content.ts`: 88건 JSON 원장·`DISEASE_LINK_RULES`(질환 페이지 내부 링크)를
  지웠다. 이 저장소에는 이관 콘텐츠도 질환 라우트도 없다. 문구는 마디클리닉 기준이고
  라벨은 GNB 하위 항목과 같은 "블로그"다.
- `column-category.ts`: manifest(88건·카테고리 6개) 대신 `columnCategoryRefFromTerms`만
  남겼다. 분류 목록·SEO 문구는 CMS 공개 분류 API(`/v1/cms/public/categories`)에서 읽고
  코드에는 분류 slug가 없다(PLAN.md §4.2).
- `column-model.ts`: 분류가 정확히 하나가 아닌 글은 표시 모델이 `null`이다. 정적 원장이
  없어 주소를 보완할 수 없으므로 목록·사이트맵에서 빠지고 상세는 404다. 이관 HTML 전용
  정화 경로(`imported-html`)와 옛 게시판 썸네일도 함께 빠졌다.
- `column-source.ts`: 폴백(이관 JSON 88건) 대신 `status: 'ok' | 'unconfigured' | 'upstream'`.
  실패는 빈 목록 + `ColumnSourceNotice` 안내 문구이고 상세는 404다. 글이 0건인 분류도
  (구주소가 없으므로) 분류 화면으로 연다.
- 화면: `SiteHeader`·`SitePageHero`·`FinalCta`·`DiseaseClosing`·`ContentCafeLink`·
  `FloatingQuickMenu`·`SiteExposures` 대신 `MadiPageFrame`. 바이라인 "광주 남구
  마디클리닉 이경무 원장"(본 사이트 `/doctor/doctor02.html` 링크), 대표 이미지 없는
  글의 도판은 `/madi/img/hi_gwangju2020_20240826.png`.
- 상세 하단: headnerve `ClinicGuide`(Tiptap JSON) 자리에 `.commonBox` 진료 안내 박스
  (`features/clinic-guide/ClinicGuide.tsx`) + 의료 면책 문구. 전화 062-675-0750·네이버
  예약·카카오 채널 버튼 3개이고 주소·진료시간은 `src/data/clinic.ts`에서 읽는다
  (본 사이트 `/clinic/clinic01.html` 2026-09-15 확인값을 `clinic.hours`로 추가).
- CSS: `styles/site/column.css`(headnerve 1266줄 → `--figma-*`·Pretendard를 `--madi-*`·
  Noto Sans KR로 치환), `styles/site/post-pattern.css`(진료 안내 박스 안쪽). 상세 제목
  카드의 어두운 판은 마디 표면 토큰에 없어 흰 바닥 + `--madi-primary` 밑줄로 바꿨고,
  `ds/` 버튼은 헤더 버튼 문법(`.column-empty__link`)으로 대체했다. 모바일(≤767px) 목록
  문법(2026-09-12 headnerve 기록)은 유지했다.
- 메타데이터: `docs/metadata-table.md`에 `/column`·`/column/{category}`·상세 값을 적었다.
  레이아웃 template을 거치지 않는 절대 `<title>`을 쓴다.

검증:

- `pnpm typecheck` 통과
- `pnpm test` 28파일 233케이스 통과(칼럼 15파일 117케이스)
- `pnpm build` 통과
- `pnpm test:e2e` 6케이스 통과(`tests/column-list.spec.ts`·`column-detail.spec.ts`,
  목 CMS 없이 도는 골격·빈 상태·404·RSS·사이트맵 범위)

## 6단계 reviews 결과 (2026-09-15)

라우트: `/reviews`, `/reviews/{slug}`(+`not-found.tsx`), `/reviews/rss.xml`,
`/reviews-sitemap.xml`. 화면은 `MadiPageFrame`(배너 02, 제목 "후기") 안이다.
`review-api`는 `@roottale/cms-client/server` 공식 클라이언트를 그대로 쓴다.

headnerve와 다르게 한 것:

- `review-content.ts` 신설: 라우트 안에 흩어져 있던 목록 문구·상세 `<title>` 조립·
  치료경험담 고지를 한 곳으로 모았다. 라벨은 GNB 하위 항목과 같은 "후기"다.
- `review-model.ts`: 기본 설명·SEO 제목 접미사를 마디클리닉으로. 대표원장 판별은
  `features/clinic/doctor-profile-link.ts`(`clinic.representative` = 이경무)를 쓰고
  링크는 본 사이트 `http://gwangju2020.madiclinic.co.kr/doctor/doctor02.html`다.
- `ReviewCard`: 대체 도판을 `/madi/img/hi_gwangju2020_20240826.png`(240×60)로,
  `ds-inline-link` 대신 `.review-card__doctor`(밑줄 링크)로 바꿨다.
- 상세 하단: 진료 안내 박스(`ClinicGuide`) + 치료 경험담 고지 + `ReviewFaq` 세 개다.
  headnerve의 예약 CTA 섹션(`review-detail__cta`)은 진료 안내 박스의 버튼 3개와 겹쳐
  뺐고, 의료진 카드(`review-detail__doctor`)는 쓸 원장 사진 자산이 없어 뺐다
  (PLAN.md §8-5 로고·사진 자산 미결과 같은 이유). 카페 링크도 쓰지 않는다.
- 목록·상세의 어두운 소개 띠(`.reviews-hero`)는 `MadiSubVisual`이 대신한다.
  `.reviews-archive`·`.review-related`의 옅은 색 띠는 흰 바닥으로 바꿨다 — 본 사이트
  본문(`#subContainer`)이 흰 바닥이다(DESIGN.md §1.3).
- CMS 미설정·장애일 때 목록은 `준비 중`/`불러오지 못했습니다` 안내를 띄우고, 상세는
  200 + 상태 안내다(headnerve와 같은 판정: 404로 끊으면 키가 생겼을 때 살아날 주소를
  없다고 알리게 된다). RSS·사이트맵은 빈 피드를 캐시하지 않고 503 + `retry-after`다.
- 의료광고 심의 문구는 PLAN.md §8-3 미결이라 확정하지 않았다. 현재 문구는
  `reviewDisclosure`(치료 경험담 고지) 하나이고, 심의 표기가 정해지면 그 상수만 고친다.

검증:

- `pnpm typecheck` 통과
- `pnpm test` 35파일 273케이스 통과(후기 8파일 43케이스)
- `pnpm build` 통과
- `pnpm test:e2e` 9케이스 통과(`tests/reviews.spec.ts` 3케이스 포함)

## 실브라우저 확인 (2026-09-15, Aside)

production build(`next start`, 49118)를 `/column`·`/reviews`에서 1440·390px로 확인했다.
캡처: `~/workspace/output/gwangju2020blog-madiclinic/2026-09-15-phase-b1/`(커밋 제외).

Aside REPL의 페이지 객체는 뷰포트를 바꿀 수 없어(창 1440×900 고정) 2단계 헤더 diff와
같은 방법을 썼다 — 같은 출처 리버스 프록시 + 폭 고정 `scrolling=no` iframe 하니스.

| 페이지 | 폭 | 헤더 | 서브 배너 | 브레드크럼 | main | 가로 스크롤 |
|---|---|---|---|---|---|---|
| `/column` | 1440 | 0~140 | 0~300 | 300~360 | 360~ (폭 1200) | 없음 |
| `/column` | 390 | 0~120 | 0~200 | 200~260 | 260~ | 없음 |
| `/reviews` | 1440 | 0~140 | 0~300 | 300~360 | 360~ (폭 1200) | 없음 |
| `/reviews` | 390 | 0~120 | 0~200 | 200~260 | 260~ | 없음 |

- 서브 배너 제목·h1·브레드크럼 라벨이 `블로그`/`후기`로 GNB 하위 항목과 같다.
- CMS 키가 없어 `/column`은 안내 문구 + 빈 목록 카드, `/reviews`는 `준비 중` 안내 +
  `다시 시도하기` 버튼(40px pill, `--madi-primary`)이 나온다.
- body 글꼴은 `'Noto Sans KR', 'Nanum Gothic', 'Malgun Gothic', '맑은 고딕', sans-serif`,
  제목 색 `#222`(=`--madi-text-strong`)으로 DESIGN.md 토큰과 같다.

### 결정이 필요한 것

한 페이지에 `h1`이 둘이다. 헤더 로고가 본 사이트 그대로 `h1.ci`(1px 재현 대상)이고,
본문 제목도 지시대로 `h1`(블로그·후기)이다. 본 사이트는 서브 페이지 제목을 `h2`로
쓰므로, 본문 제목을 `h2`로 낮추거나 로고를 `div`로 바꾸는 선택이 남아 있다. 헤더는
픽셀 재현 계약이 있어 이 단계에서 바꾸지 않았다.

## 7단계 faq 결과 (2026-09-15)

라우트: `/faq`, `/faq/{section}`, `/faq/{section}/{topic}`,
`/faq/{section}/{topic}/{slug}`, `/faq-sitemap.xml`. 화면은 모두
`MadiPageFrame`(배너 03, 제목 "자주 묻는 질문") 안이다. 구조(네 단계 URL·질문 성격
필터·예약 내부 링크·관련 콘텐츠·250px 목차 사이드바)는 headnerve ADR-0006 그대로다.

가져온 것: `src/features/faq/{faq-cache,faq-model,faq-wire,faq-registry,faq-api,
faq-source,faq-sitemap,faq-revalidation,faq-detail-outline,faq-import,
faq-sheet-import}.ts`, `{FaqPageFrame,FaqShared,FaqHomePage,FaqSectionPage,
FaqTopicPage,FaqDetailPage}.tsx`, `styles/site/{faq,faq-detail}.css`,
`scripts/{import-faq-sheet,sync-faq-content}.ts`, package.json
`cms:faq:sheet`·`cms:faq:sync`.

headnerve와 다르게 한 것:

- `faq-model.ts`: `FAQ_SECTION_SLUGS`(진료 영역 5개 상수)·`FaqSectionSlug`·
  `isFaqSectionSlug`를 걷어냈다. `faq-registry.ts`의 headnerve 질환 콘텐츠
  import(`features/disease/*`·`features/headache/*`)도 전부 없다. 진료 영역(1단계)·
  세부 질환(2단계)은 CMS 모델(`fetchFaqModel`)과 공개 분류 API의 부모·자식 관계에서만
  읽는다(PLAN.md §4.2). 코드에 분류 slug가 하나도 없다.
- `faq-registry.ts`는 정적 표 대신 순수 변환(`faqTaxonomyFromCategories`)과 빈 폴백
  원장(`fallbackFaqArchive = { source: 'fallback', entries: [] }`)만 갖는다.
  `faqTopicsForEntries`(글에서 분류를 추론하던 경로)는 없앴다 — 분류의 권위가 CMS라
  추론할 일이 없다.
- `faq-api.ts`는 글 원장과 분류 트리를 한 응답·한 캐시로 함께 읽는다(`FaqCatalog`).
  headnerve는 트리가 코드에 있어 글만 받았다.
- `faq-wire.ts`의 분류 조회가 `description`·`seo_title`·`seo_description`도 읽는다.
  영역·질환의 화면 문구와 SEO 문구가 모두 CMS에서 와야 한다.
- 예약 키 역변환(`faqInternalLinkKeyFromPath`)은 4단계에서 둔 `faq-cache.ts` 한 곳이
  소유하고 `faq-model`이 재수출한다. headnerve는 `faq-model`에서 정적 영역 목록으로
  1단계를 걸렀다.
- 빈 상태: `unconfigured`(키 없음)·`no-model`(모델 미선언)·`upstream`(CMS 장애)·분류
  0건·발행 글 0건을 각각 다른 안내 문구로 구분한다(`faq-content.faqNotices`).
  하위 단계(`/faq/...`)는 CMS를 읽을 수 없는 동안 404가 아니라 200 + 상태 안내
  (`FaqStatePage`, `noindex, follow`)다 — 나중에 살아날 주소를 없다고 알리지 않는다.
  없는 분류·없는 글은 CMS 성공 응답에서만 404다.
- 화면: `SiteHeader`·`SiteClosing`(지도·푸터)·`ContentCafeLink`·본문 안 두 번째
  브레드크럼은 쓰지 않는다. 영역 카드는 질환 도판 없이 `.commonBox` 표면
  (`border-top: 1px --madi-primary` + `--madi-bg-panel`)과 `.cBox h4` 밑줄 문법이다.
  의사 사진(`lee-jaesung`) 대신 이름 링크(`doctor-profile-link`)를 쓴다. 상세 하단은
  칼럼·후기와 같은 `ClinicGuide` 진료 안내 박스다(headnerve의 `pattern_slots` 배치값
  대신).
- CSS: `--figma-*`·하드코딩 색·Pretendard를 전부 `--madi-*`·Noto Sans KR로 바꿨다.
  왼쪽 강조선(`border-left: 2px`)은 마디 토큰에 없어 `.commonBox` 문법으로,
  카드 라운드는 본 사이트처럼 사각으로 바꿨다. 반응형 경계는 760px → DESIGN.md §3의
  980·660px이다.
- 웹훅: 6단계에서 미뤄 둔 FAQ 역참조 무효화를 `api/revalidate/route.ts`에 연결했다
  (`resolveFaqArchive({ fresh: true })` + `affectedFaqDetailPaths`). 칼럼·후기 웹훅은
  FAQ 원장을 읽지 않는다(테스트로 고정).
- `scripts/sync-faq-content.ts`는 정적 초기 원장이 비어 있어 즉시 안내 후 종료한다.
  계획·충돌 판정(`faq-import.ts`)은 그대로 살려 뒀고 시트 가져오기
  (`pnpm cms:faq:sheet`)를 안내한다. `scripts/faq-cms-api.ts`의 임시 타입 선언은
  `features/faq/{faq-import,faq-wire}` import로 되돌렸다.
- 테스트 픽스처: headnerve는 검수 FAQ 71건을 단정했다. 여기서는 CMS 분류 픽스처
  (`faq-fixture.ts` — 영역 2개·세부 질환 3개·발행 글 4건)로 화면·사이트맵·목차·
  웹훅을 덮는다.

검증:

- `pnpm typecheck` 통과
- `pnpm test` 48파일 389케이스 통과(FAQ 13파일 104케이스)
- `pnpm build` 통과(`/faq`·`/faq/[section]`·`/faq/[section]/[topic]`·
  `/faq/[section]/[topic]/[slug]`·`/faq-sitemap.xml` 등록 확인)
- `pnpm test:e2e` 13케이스 통과(`tests/faq.spec.ts` 4케이스 — 골격·390px·빈 상태·
  사이트맵 503·라우트 밖 404)
- `docs/metadata-table.md`에 `/faq` 네 단계 제목·설명을 적었다.

## 8단계 seo 결과 (2026-09-15)

새로 넣은 라우트: `src/app/sitemap.xml/route.ts`(인덱스, 자식 4개),
`src/app/sitemap-static.xml/route.ts`. `public/robots.txt`는 3단계에서 이미
`Disallow: /preview/` + `Sitemap: https://gwangju2020blog.madiclinic.co.kr/sitemap.xml`
였다.

- 인덱스는 CMS 상태와 무관하게 자식 4개(`/sitemap-static.xml`·`/reviews-sitemap.xml`·
  `/column-sitemap.xml`·`/faq-sitemap.xml`)를 언제나 나열한다. 지금 읽을 수 없는
  컬렉션을 인덱스에서 빼면 크롤러가 그 주소들을 사라진 것으로 읽는다. 각 자식이
  자기 응답(빈 XML 또는 503)을 책임진다.
- `lastmod`는 각 컬렉션의 실제 최신 수정일이고, 읽을 수 없는 동안은 원장 기준일
  (`*_ARCHIVE_LASTMOD`)이다. 24시간 ISR 재생성이 수정일을 바꾸지 않는다.
- JSON-LD 확인: `layout.tsx`가 모든 페이지에 `WebSite`·`MedicalClinic`·`Physician`
  (`siteEntityJsonLd`)을 넣고, 목록·분류는 `CollectionPage`, 상세는 `WebPage`,
  칼럼 상세는 `Article`, FAQ 상세는 `FAQPage`, 후기 상세는 FAQ 블록이 있을 때
  `FAQPage`를 더한다. `BreadcrumbList`는 `MadiBreadcrumb`이 화면 브레드크럼과 같은
  배열에서 만든다(한 곳에서 나오므로 갈라질 수 없다).
- headnerve 테스트 포트: `tests/sitemap.spec.ts`(자식 4개·새 호스트·robots),
  `tests/seo-schema.spec.ts`. headnerve 원본은 실데이터 상세를 클릭해
  `Article`·`FAQPage`를 봤는데 이 저장소는 아직 발행 글이 없어 목록 세 개의 전역
  엔티티·`CollectionPage`·`BreadcrumbList`와 화면/스키마 브레드크럼 일치를 본다.
  상세 스키마는 단위 테스트(`ColumnDetailRoute`·`FaqPages.test.tsx`)가 덮고 실데이터
  확인은 9단계로 남긴다.
- `src/features/seo/static-sitemap.test.ts` 신설: 정적 목록이 세 기능 목록 페이지뿐이고
  301되는 `/`와 CMS 글이 들어가지 않는지, 수정일이 배포 시각이 아닌지 고정한다.
- `docs/metadata-table.md`를 완성했다(FAQ 네 단계 + SEO 라우트 표 + 전역 구조화 데이터).

검증: `pnpm typecheck` 통과, `pnpm test` 49파일 392케이스 통과, `pnpm build` 통과
(`/sitemap.xml`·`/sitemap-static.xml` 등록 확인), `pnpm test:e2e` 19케이스 통과.

## 정리 작업 (2026-09-15)

### 1. h1 중복 해소

헤더 로고가 본 사이트 그대로 `h1.ci`(데스크톱)·`h1.logo`(모바일 드로어)이고 그
마크업은 2단계의 1px 재현 계약이라 바꾸지 않았다. 대신 본문 제목을 본 사이트 서브
페이지와 같이 `h2`로 낮췄다.

- 목록: `ColumnArchive`·`ColumnCategoryPage`·`/reviews`·FAQ(`FaqCollectionIntro`)
- 상세: `ColumnDetailRoute`·`ColumnPreviewRoute`·`/reviews/{slug}`·FAQ(`.faq-detail__title`)
- 상태 화면: `/reviews/{slug}` 오류·`not-found`·`FaqStatePage`
- CSS 선택자(`.column-detail__header h1` → `h2`, `.review-detail__header h1` → `h2`,
  `.reviews-state h1, h2` → `h2`)와 Playwright 단정(`level: 1` → `level: 2` +
  `main#main h1` 0건)도 함께 고쳤다. 글자 크기는 옮겨 온 값 그대로다.

배너 제목은 이미 `h2`(본 사이트 `#bnSubArea .sbn > h2`)이고 본문 제목과 같은 등급이
둘이 되는 것은 허용 범위다(본 사이트도 배너 h2 + 본문 h2~h3). FAQ는 새로 쓰는
코드라 본문 섹션 제목을 `h3`으로 한 단계 더 낮췄다.

### 2. 미사용 컴포넌트 삭제

`src/components/site/{SiteBreadcrumb,BreadcrumbJsonLd}.tsx`를 지웠다. 4단계에서
headnerve에서 가져왔지만 이 저장소의 브레드크럼은 `MadiBreadcrumb`(본 사이트
`.whereIsLine` 문법 + `BreadcrumbList` JSON-LD)이고 FAQ도 그것을 쓴다. 사용처가
하나도 없었다(`grep` 확인).

## 실브라우저 확인 (2026-09-15, Aside)

production build를 `/faq`·`/column`·`/reviews`에서 1440·390px로 확인했다. FAQ 네
단계는 로컬 목 CMS(QA 전용, 운영 키 미사용)를 붙여 실데이터 화면까지 봤다.
캡처·하니스·목 서버: `~/workspace/output/gwangju2020blog-madiclinic/2026-09-15-phase-b2/`
(커밋 제외, `README.md`에 방법과 측정값).

| 페이지 | 폭 | 헤더 | 서브 배너 | 브레드크럼 | main | 가로 스크롤 |
|---|---|---|---|---|---|---|
| `/faq` | 1440 | 0~140 | 0~300 | 300~360 | 360~ | 없음 |
| `/faq` | 390 | 0~120 | 0~200 | 200~260 | 260~ | 없음 |
| `/column`·`/reviews` | 1440·390 | 같음 | 같음 | 같음 | 같음 | 없음 |
| FAQ 영역·질환·상세 | 1440·390 | 같음 | 같음 | 같음 | 같음 | 없음 |

- 모든 화면에서 `main` 안 `h1`은 0개다(헤더 로고 2개만 `h1`).
- 브레드크럼 띠 좌표·폭이 1440/1220/980/768px에서 `main`과 같다. 390px FAQ 상세만
  칸이 넘쳐 띠 안에서 가로로 흐른다.

### 이 확인에서 찾아 고친 것

1. **브레드크럼 float 넘침** — 칸은 140px 고정 float라 FAQ 상세(홈+5칸=740px)가
   390px에서 줄을 넘었고, 60px 띠 밖으로 흘러 본문이 그 float를 피해 오른쪽으로
   밀렸다(본문 폭 370 → 90px). `styles/madi/patterns.css`에서 띠를 가로 스크롤
   컨테이너로 바꿨다(`min-width: min(100%, 1200px)` — 칸이 다 들어가는 폭에서는
   원본과 같은 좌표다).
2. **`.faq-layout`의 margin이 빠져나감** — `.cBox`의 `padding-top`이 ≤980px에서 0이라
   (원본 값) 상세 화면에서 `margin-top: 40px`이 `main`까지 타고 나가 본문 전체를
   밀었다. `padding-top`으로 바꿨다.
3. **반응형 시트가 밀림** — headnerve의 `faq-responsive.css`를 따로 두니 Next가
   `faq-detail.css`를 그 뒤에 놓아 `@media` 덮어쓰기가 기본값에 밀렸다(390px에서
   `align-items: flex-start` 미적용). 반응형 규칙을 기본 규칙과 같은 파일로 합치고
   그 시트를 지웠다. headnerve는 세 시트를 한 배럴에서 같은 순서로 불러 문제가
   없었지만, 이 저장소는 라우트마다 필요한 시트만 부른다.
4. **상세 캐시가 비밀값 게이트를 건너뜀** — 목 CMS로 한 번 띄운 뒤 키 없이 띄우니
   `unstable_cache` 엔트리(`.next/cache`)가 되살아나 목 데이터가 그대로 나왔다.
   `resolveFaqDetailCollection`이 캐시보다 먼저 `isFaqCmsConfigured()`를 보게 고쳤다
   (칼럼 `column-api.ts`와 같은 규칙). 회귀 테스트를 넣었다.

### 남은 것

- 칼럼·후기 상세, FAQ 실데이터 화면은 ROOT-ADMIN 실데이터로 다시 봐야 한다(9단계).
- `layout.tsx`의 `#5bbad5`(safari mask-icon)·`#ffffff`(themeColor)는 브랜드 파비콘
  세트 값이자 Next `Viewport` 타입이 리터럴을 요구하는 자리라 토큰으로 바꾸지 않았다.

## 운영 연동 확인 (2026-09-22)

- [x] 기존 사이트 `gwangju2020-blog-madiclinic`와 콘텐츠 모델 `column`·`faq`·`reviews` 연결.
- [x] Vercel Production·Preview·Development 읽기 키 연결 및 운영 배포.
- [x] 원문 분류를 마디클리닉에 독립 생성하고 세 유형의 사본 발행.
- [x] ROOT-ADMIN 빠른 편집에서 후기·FAQ 제목 변경 및 복구 → 공개 화면 자동 갱신.
- [x] 후기 RSS, 후기·FAQ 사이트맵과 상세 주소 HTTP 200.
- [ ] 실데이터 기준 1440·390px 전체 화면 캡처(이번 작업은 목록·상세 동작 검증).

복사 범위·원본 보호·웹훅 수정 근거·남은 제약: [headnerve-copy.md](headnerve-copy.md).
