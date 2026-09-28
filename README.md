# (주)부명 BOOMYUNG 홈페이지

회사 Cloudflare 계정의 Pages 프로젝트 `homepage`로 배포되는 운영 사이트입니다.
최종 시안(siteF)을 기반으로 합니다.

- 정적 멀티 페이지 HTML/JS (빌드 단계 없음) + Cloudflare Pages Functions
- D1 `boomyung-homepage-db` (`DB`) — 페이지 문구, 문의, 관리자 인증
  - 테이블은 첫 API 요청 때 `functions/_middleware.js`가 자동으로 만듭니다
- R2 `boomyung-homepage-media` (`MEDIA`) — 어드민에서 올린 이미지(`/api/asset/<id>`)와 영상(`/api/video/<id>`)
  - 영상은 Range 요청을 지원합니다(아이폰 사파리 재생에 필요)
  - 편집 중 바꾸거나 지운 파일은 저장 뒤 어느 문서에서도 쓰지 않으면 자동으로 삭제됩니다
- Workers AI (`AI`) — 어드민 영문 자동 번역
- 비밀값 `ADMIN_PASSWORD` — 어드민 로그인 (Pages 설정에서 지정)
