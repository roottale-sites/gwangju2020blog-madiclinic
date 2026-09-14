# 작업 목록 — 광주 Dr.이 마디클리닉 블로그

정본 설계: `docs/PLAN.md`, 디자인 토큰: `docs/DESIGN.md`.
단계 정의는 PLAN.md §6을 따른다. 각 단계는 typecheck·관련 vitest 통과 후 로컬 커밋한다.

## 구현 단계 (PLAN.md §6)

- [x] 1. **scaffold** — `index.html` 제거, Next.js 16 앱 생성, tsconfig·vitest·playwright 설정, `.env.example`, `docs/TODO.md`, `/`→`/column` 301
- [x] 2. **header** — `MadiHeader.tsx`·`MadiHeaderBehavior.tsx`·`styles/madi/header.css`·`public/madi/img/*`·Noto Sans KR `@font-face`. 본 사이트와 5폭 픽셀 diff
- [x] 3. **shell** — `tokens.css`, `MadiSubVisual`, `MadiBreadcrumb`, `MadiFooter`, `data/{site,clinic,nav}.ts`, `seo/schema.ts`, `layout.tsx`, 파비콘·OG, `styles/madi/patterns.css`
- [x] 4. **cms-infra** — `features/cms/*`, `features/seo/*`, `api/revalidate`, `preview`, `cms/content-models.json`(PLAN §4.2)
- [x] 5. **column** — 목록·카테고리·상세·검색 포트, 브랜드 교체, 테스트 재작성
- [ ] 6. **reviews** — 목록·상세 포트
- [ ] 7. **faq** — 4단계 화면 포트, `faq-registry`를 CMS 분류 기반으로 재작성
- [ ] 8. **seo** — `sitemap.xml` 인덱스·`sitemap-static.xml`·robots·JSON-LD·`docs/metadata-table.md`
- [ ] 9. **provision**(사용자 참여) — ROOT-ADMIN 사이트 생성 → 모델 동기화 → API 키 Vercel 등록 → 웹훅 등록 → 글 1건씩 발행
- [ ] 10. **release** — Playwright, production build, Aside 3폭 확인, `docs/TODO.md`·llm-wiki 기록. 승인 후 main push·배포

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
