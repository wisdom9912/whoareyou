// 라우터 시스템
class Router {
  constructor() {
    this.routes = {};
    this.currentPage = null;
  }
  
  register(path, pageModule) {
    this.routes[path] = pageModule;
  }
  
  async navigate(path, params = {}) {
    // 현재 페이지 정리
    if (this.currentPage && this.currentPage.cleanup) {
      this.currentPage.cleanup();
    }
    
    // URL 업데이트 (히스토리 API 사용)
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString() 
      : '';
    const fullPath = path === '/' ? '/home' : path;
    window.history.pushState({ path: fullPath, params }, '', fullPath + queryString);
    
    // 새 페이지 로드
    const pageModule = this.routes[fullPath] || this.routes[path];
    if (!pageModule) {
      console.error('Page not found:', fullPath);
      return;
    }
    
    this.currentPage = pageModule;
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = await pageModule.render(params);
      if (pageModule.init) {
        pageModule.init(params);
      }
    }
  }
  
  init() {
    // 브라우저 뒤로/앞으로 버튼 처리
    window.addEventListener('popstate', (e) => {
      if (e.state) {
        this.navigate(e.state.path, e.state.params || {});
      } else {
        // popstate 이벤트에서 state가 없을 경우 현재 URL 파싱
        const path = window.location.pathname === '/' ? '/home' : window.location.pathname;
        const params = Utils.getQueryParams();
        this.navigate(path, params);
      }
    });
    
    // 초기 페이지 로드
    let path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
      path = '/home';
    } else if (path.endsWith('.html')) {
      // .html 확장자 제거 및 경로 변환
      const basePath = path.replace(/\.html$/, '');
      const pathMap = {
        '/index': '/home',
        '/info': '/info',
        '/profile': '/profile',
        '/register': '/register',
        '/mytomodacchi': '/mytomodacchi',
        '/wheretogo': '/home'
      };
      path = pathMap[basePath] || basePath;
    }
    
    const params = Utils.getQueryParams();
    this.navigate(path, params);
  }
}

const router = new Router();

