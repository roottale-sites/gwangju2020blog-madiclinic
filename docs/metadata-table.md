# 메타데이터 표

`<title>`·`description`의 기본값과 CMS 연동 규칙 원장이다. CMS에 입력한 값이 우선하며, 비어 있을 때 아래 기본값을 사용한다.

## CMS 편집 위치

ROOT-ADMIN **설정 → 검색·공유 표시 → 페이지별 설정**에서 목록 첫 화면·글·분류의 검색 제목·설명·공유 이미지·이미지 대체 텍스트·검색 제외·링크 추적 제외를 관리한다. **설정 → 주소 이동**은 기존 주소의 이동 규칙을 관리한다. 두 기능의 직접 편집은 Pro·Premium에 제공하며, 기본 요금제로 내려가도 기존 적용값은 유지하고 편집만 제한한다.

목록 첫 화면은 [`cms/site-content-contract.json`](../cms/site-content-contract.json)의 `metadata.routes`에 선언하며 별도 CMS 페이지를 발행하지 않는다. 글·분류의 기존 SEO 원본은 그대로 사용한다. 직접 입력값을 지우면 콘텐츠 기본값 → 사이트 기본값 → 코드 대체값 순서로 돌아간다. 조회 장애는 정상적인 미설정 응답과 구분한다. 기존 고객 값의 이관과 운영 전환은 [ROOT-ADMIN 연동 문서](root-admin-integration.md)를 따른다.

직접 입력한 제목·설명은 자동 정리·잘림 없이 사용한다. 글 제목 접미사·요약 정리·이미지 대체 규칙은 계약의 `posts`·`terms` 자동값 선언에만 적용한다. `<title>`은 레이아웃 template을 다시 거치지 않는 절대값(`metadata.title.absolute`)이다. 코드 페이지의 제목·설명 기본값도 연결 계약 한 곳에서 읽는다. canonical은 기존 공개 경로 계약을 따르며, 검색·필터와 초안 미리보기의 강제 색인 제한은 유지한다.

칼럼 전체·분류, 치료후기, FAQ 영역·질환 목록은 페이지 번호(`?page=2` 이상)만으로
`noindex`를 적용하지 않는다. 검색·필터에 따른 `noindex, follow`는 아래 표를 따르며,
canonical은 각 목록의 기본 주소로 유지한다.

## 공통 404

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| 존재하지 않는 경로 | 페이지를 찾을 수 없습니다 \| 광주 남구 마디클리닉 | 요청하신 페이지를 찾을 수 없습니다. 블로그, 자주 묻는 질문, 후기 또는 병원 홈페이지에서 필요한 정보를 확인해 주세요. | `noindex, follow`. 공통 헤더·푸터와 커뮤니티·병원 바로가기 제공 |

없는 후기에는 같은 404 디자인과 아래 후기 전용 안내 문구를 사용한다.

## 블로그(칼럼)

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| `/column` | 광주 남구 마디클리닉 블로그 | 광주 남구 마디클리닉 이경무 대표원장이 통증의 원인과 비수술 중점치료를 직접 씁니다. 영상유도하 통증중재시술 의료기관. | `columnIndexMetadata`. `?q=` 검색 결과는 `noindex, follow` |
| `/column/{category}` | {분류 SEO 제목} | {분류 SEO 설명}, 비어 있으면 `/column` 설명 | CMS 공개 분류 API의 `seo_title`을 완전한 제목으로 사용한다. 비어 있으면 분류 이름을 쓴다(PLAN.md §4.2) |
| `/column/{category}/{slug}` | 글의 `seo.title`, 없으면 {글 제목} \| 광주 남구 마디클리닉 블로그 | 글의 `seo.description` → 발췌문 → 기본 문구(160자 상한) | canonical은 플랫폼이 저장한 공개 경로(ADR-0105) |
| 없는 분류·글 | 공통 404 제목 | 공통 404 설명 | `noindex, follow` |

## 후기

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| `/reviews` | 치료후기 \| 광주 남구 마디클리닉 | 광주 남구 마디클리닉에서 치료받은 분들이 직접 남긴 치료 경험담입니다. | `reviewsIndexMetadata`. `?category=`·`?q=`는 `noindex, follow`이고 canonical은 `/reviews` 고정 |
| `/reviews?category={분류}` | {분류} 치료후기 \| 광주 남구 마디클리닉 | 광주 남구 마디클리닉의 {분류} 치료 경험담입니다. 개인의 경험은 서로 다를 수 있습니다. | 분류는 CMS 글에 붙은 분류 이름이다 |
| `/reviews/{slug}` | 글의 `seo.title`, 없으면 {후기 제목} \| 치료후기 \| 광주 남구 마디클리닉 | 글의 `seo.description` → 발췌문 → 목록 설명(180자 상한) | canonical은 플랫폼이 저장한 공개 경로(ADR-0105). 옛 slug 요청은 정규 주소로 308 |
| 없는 후기 | 후기를 찾을 수 없습니다 \| 치료후기 \| 광주 남구 마디클리닉 | 요청한 후기를 찾을 수 없습니다. | `noindex, follow` |
| CMS 장애 | 후기 연결 오류 \| 치료후기 \| 광주 남구 마디클리닉 | 후기를 일시적으로 불러오지 못했습니다. | `noindex, follow`. 404가 아니라 200 + 상태 안내(나중에 살아날 주소다) |

## 자주 묻는 질문

네 단계 모두 `<title>`이 절대값이고, 분류 문구는 CMS 공개 분류 API(`seo_title`·
`seo_description`·`description`)에서 읽는다. 코드에는 분류를 두지 않는다(PLAN.md §4.2).
문구가 비어 있을 때 쓰는 조립 서식은 연결 계약의 `metadata.terms`가 소유한다.

| URL | `<title>` | `description` | 비고 |
|---|---|---|---|
| `/faq` | 질환별 자주 묻는 질문 \| 광주 남구 마디클리닉 | 광주 남구 마디클리닉 이경무 대표원장이 진료실에서 자주 받는 질문에 답합니다. 통증의 원인과 검사, 비수술 중점치료와 경과를 확인하세요. | `faqIndexMetadata` |
| `/faq/{section}` | 영역 `seo_title`, 없으면 {영역 이름} 자주 묻는 질문 \| 광주 남구 마디클리닉 | 영역 `seo_description` → `description` → `{영역 이름}에 관해 진료실에서 자주 받는 질문과 답변입니다.` | 진료 영역(1단계 분류) |
| `/faq/{section}/{topic}` | 질환 `seo_title`, 없으면 {질환 이름} 자주 묻는 질문 \| 광주 남구 마디클리닉 | 질환 `seo_description` → `description` → `{질환 이름}의 증상·검사·치료와 경과에 관해 자주 묻는 질문입니다.` | 세부 질환(2단계 분류). `?intent=`는 `noindex, follow`이고 canonical은 이 주소 고정 |
| `/faq/{section}/{topic}/{slug}` | 글의 `seo.title`, 없으면 {질문} \| 광주 남구 마디클리닉 | 글의 `seo.description` → 핵심 답변(160자 상한) | 영역에 바로 붙은 `/faq/{section}/{slug}`도 동일. canonical은 플랫폼이 저장한 공개 경로(ADR-0105). `rt:content-id`로 조회수를 귀속한다 |
| 없는 영역·질환·질문 | 공통 404 제목 | 공통 404 설명 | CMS 성공 응답에서만 404다. 공통 404 화면과 `noindex, follow` 적용 |
| CMS 장애·키 미설정·모델 미선언 | 자주 묻는 질문 연결 오류 \| 광주 남구 마디클리닉 | 상태별 안내 문구(`faqNotices`) | `noindex, follow`. 404가 아니라 200 + 상태 안내(나중에 살아날 주소다) |

## SEO 라우트

| URL | 내용 |
|---|---|
| `/sitemap.xml` | 사이트맵 인덱스. 자식 4개(`/sitemap-static.xml`·`/reviews-sitemap.xml`·`/column-sitemap.xml`·`/faq-sitemap.xml`) |
| `/sitemap-static.xml` | 정적 목록 `/column`·`/reviews`·`/faq` |
| `/column-sitemap.xml` | 칼럼 목록·분류·글 |
| `/reviews-sitemap.xml` | 후기 목록·글 |
| `/faq-sitemap.xml` | FAQ 홈 + 글이 있는 영역·질환 + 답변 |
| `/column/rss.xml`, `/reviews/rss.xml`, `/faq/rss.xml` | 섹션별 피드 |
| `/column/sitemap.xml`, `/reviews/sitemap.xml`, `/faq/sitemap.xml` | 기존 전용 사이트맵과 같은 내용을 제공하는 섹션 주소 |
| `/robots.txt` | `Disallow: /preview/`, `Sitemap: https://gwangju2020blog.madiclinic.co.kr/sitemap.xml` |

공유 메타데이터는 대응되는 [headnerve.com](https://headnerve.com/sitemap.xml)의 URL 계층을 따른다. 원래 병원 사이트의 `og:image`가 비어 있어 헤더 로고로 만든 1200×630 이미지를 기본 OG 이미지로 쓴다. 칼럼·후기 상세는 공개 글의 대표 이미지를 우선하고, 없으면 이 기본 이미지를 쓴다. OG 사이트 이름은 `광주 남구 마디클리닉`이다.

사이트맵과 RSS의 XML 표시 형식은 [avcd 사이트맵](https://avcd.kr/sitemap.xml)·[avcd RSS](https://avcd.kr/blog/rss.xml)를 참고한다. 콘텐츠 주소와 수정일은 이 사이트의 원장을 사용한다.

## 전역 구조화 데이터

`src/app/layout.tsx`가 모든 페이지에 `WebSite`·`MedicalClinic`(마디클리닉)·
`Physician`(이경무) 세 노드를 넣는다(`siteEntityJsonLd`). 페이지별로는 목록·분류가
`CollectionPage`, 상세가 `WebPage`이고 칼럼 상세는 `Article`, FAQ 상세는 `FAQPage`,
후기 상세는 후기 FAQ 블록이 있을 때 `FAQPage`를 더한다. `BreadcrumbList`는
`MadiBreadcrumb`이 화면 브레드크럼과 같은 배열에서 만든다.
