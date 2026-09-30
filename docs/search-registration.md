# 검색엔진 수집 등록

공개 사이트는 https://gwangju2020blog.madiclinic.co.kr 이다. `/`는 `/column`으로 이동하고 `/column`·`/reviews`·`/faq`는 검색 수집을 허용한다. 삭제한 콘텐츠는 404와 noindex를 반환하며 공개 사이트맵·RSS에서 제외한다.

- Google Search Console URL 접두어 속성의 소유권 확인 파일은 `public/googleea802a83306b9a49.html`이다. 소유권을 유지하려면 삭제하지 않는다.
- IndexNow 소유권 확인 파일은 `public/cfc626416b22e7efe145c466c52cdf57.txt`다. 이 파일은 공개 검증용이며 관리자/API 인증 자격이 아니다. 제출 시 같은 호스트의 URL만 알린다.
- 제출할 사이트맵은 `/sitemap.xml`이다. 네이버·Bing 등 IndexNow 참여 검색엔진에는 추가·수정·삭제 URL을 IndexNow 규약으로 알릴 수 있다. 제출 성공은 색인 완료를 뜻하지 않는다.
- 네이버 서치어드바이저 계정의 소유권 등록과 IndexNow 알림은 별개다. 계정 등록 여부를 IndexNow 응답으로 판단하지 않는다.

검증 근거: [Google 재수집 안내](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [IndexNow 규약](https://www.indexnow.org/documentation). 실제 제출 결과와 QA 기록은 workspace/output의 해당 검수 보고서에서 관리한다.
