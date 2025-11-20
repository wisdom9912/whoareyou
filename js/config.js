// 공통 설정
const CONFIG = {
  // 로컬 환경에서는 현재 호스트 사용, 프로덕션에서는 프로덕션 URL 사용
  BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? window.location.origin
    : 'https://7bfc4300.whoareyou-4bx.pages.dev'
};

