# 작업 목록 — 광주 Dr.이 마디클리닉 블로그

정본 설계: `docs/PLAN.md`, 디자인 토큰: `docs/DESIGN.md`.
단계 정의는 PLAN.md §6을 따른다. 각 단계는 typecheck·관련 vitest 통과 후 로컬 커밋한다.

## 구현 단계 (PLAN.md §6)

- [ ] 1. **scaffold** — `index.html` 제거, Next.js 16 앱 생성, tsconfig·vitest·playwright 설정, `.env.example`, `docs/TODO.md`, `/`→`/column` 301
- [ ] 2. **header** — `MadiHeader.tsx`·`MadiHeaderBehavior.tsx`·`styles/madi/header.css`·`public/madi/img/*`·Noto Sans KR `@font-face`. 본 사이트와 5폭 픽셀 diff
- [ ] 3. **shell** — `tokens.css`, `MadiSubVisual`, `MadiBreadcrumb`, `MadiFooter`, `data/{site,clinic,nav}.ts`, `seo/schema.ts`, `layout.tsx`, 파비콘·OG, `styles/madi/patterns.css`
- [ ] 4. **cms-infra** — `features/cms/*`, `features/seo/*`, `api/revalidate`, `preview`, `cms/content-models.json`(PLAN §4.2)
- [ ] 5. **column** — 목록·카테고리·상세·검색 포트, 브랜드 교체, 테스트 재작성
- [ ] 6. **reviews** — 목록·상세 포트
- [ ] 7. **faq** — 4단계 화면 포트, `faq-registry`를 CMS 분류 기반으로 재작성
- [ ] 8. **seo** — `sitemap.xml` 인덱스·`sitemap-static.xml`·robots·JSON-LD·`docs/metadata-table.md`
- [ ] 9. **provision**(사용자 참여) — ROOT-ADMIN 사이트 생성 → 모델 동기화 → API 키 Vercel 등록 → 웹훅 등록 → 글 1건씩 발행
- [ ] 10. **release** — Playwright, production build, Aside 3폭 확인, `docs/TODO.md`·llm-wiki 기록. 승인 후 main push·배포

## 헤더 픽셀 diff 결과

2단계 완료 후 기록한다.
