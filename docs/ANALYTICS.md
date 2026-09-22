# 유입 경로와 클릭 수집

`src/features/analytics`가 ROOT-ADMIN의 공개 사이트 설정과 `@roottale/analytics-runtime`
비콘을 연결한다. API 키는 서버에서만 쓰고, 브라우저에는 사이트 ID와 공개 태그만 전달한다.
설정 API가 잠시 실패해도 발급된 `NEXT_PUBLIC_ROOTTALE_SITE_ID`로 자체 수집을 유지한다.

운영 도메인에서는 `ROOTTALE_API_BASE`의 `/v1/collect`로 전송한다. localhost와 미리보기
도메인은 `/api/analytics/debug`가 204로 받고 저장·전달하지 않는다. 브라우저 Network에서
동일한 비콘 payload를 확인할 수 있다.

## 수집 범위

- 최초 페이지와 SPA 경로·검색 조건 변경은 `pageview`로 기록한다. 내부 이동의
  pageview에는 유입 출처를 반복해서 넣지 않아 유입 횟수와 페이지 조회가 섞이지 않는다.
- 링크, 버튼, 펼치기, 이미지 확대, 모바일 메뉴, 검색, 분류·페이지 이동을 수집한다.
  전화·예약·채팅·이메일은 표준 전환 클릭, 나머지는 `cta_click`이다.
- 클릭에는 버튼 이름/위치와 현재 방문의 출처·캠페인·첫 도착 pathname을 동봉한다.
  `data-analytics-id`, `data-analytics-placement`로 이름과 위치를 명시할 수 있다.
  기존 SDK `data-track` 표식에는 출처 속성만 추가하고 SDK가 1회 전송한다.
- 글 ID를 가진 상세 페이지는 SDK의 읽기 완료 감지를 사용한다.

현재 방문 출처는 `sessionStorage._madi_entry`에 유지하며 페이지 이동·클릭이 30분 동안
없으면 새 방문으로 시작한다. 저장소를 사용할 수 없으면 같은 문서의 메모리에서 유지한다.
SDK의 최초/최근 유입(`_rt_attr`, 30일), 전환 여정(`_rt_journey`, 최대 30건)도 유지한다.
클릭 출처는 이전 방문의 광고를 가져오지 않고 현재 방문 기준으로 연결한다.

외부 referrer는 호스트만, AI 유입은 서비스 라벨만 기록한다. 광고 클릭 ID는 존재 여부만
쓰고 검색 입력값·referrer 전체 URL·광고 ID 원문은 전송하지 않는다.

## ROOT-ADMIN 연동

클릭 payload의 `attr: 1`과 `lp`는 플랫폼 수집기의 유입 연결 계약이다.
SDK 위임 클릭에서는 같은 값이 `trackAttr`, `trackLp`, `trackUs` 등으로 전달된다.
통계의 **페이지·문의 성과 → 유입 경로에서 버튼 클릭까지**에서 출처·캠페인,
첫 도착 페이지, 클릭 페이지, 버튼·위치별 횟수를 확인한다.

사이트 변경과 함께 플랫폼의 `collect`·`analytics-behavior`·유입별 클릭 화면 변경을
배포해야 이 표가 채워진다. 기존 수집기는 클릭 출처를 저장하지 않는다. 배포 전 기록을
소급해서 복원할 수 없으며, 클릭은 실제 전화 연결이나 예약 완료를 뜻하지 않는다.
