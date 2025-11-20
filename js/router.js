// 라우터 시스템 (해시 라우팅)
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
    
    // 해시 URL 생성
    const fullPath = path === '/' ? '/home' : path;
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString() 
      : '';
    const hash = '#' + fullPath + queryString;
    
    // 해시 변경 (hashchange 이벤트가 발생하지 않도록 직접 처리)
    window.location.hash = hash;
    
    // 새 페이지 로드
    await this.loadPage(fullPath, params);
  }
  
  async loadPage(path, params = {}) {
    const pageModule = this.routes[path] || this.routes['/' + path];
    if (!pageModule) {
      console.error('Page not found:', path);
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
  
  parseHash() {
    const hash = window.location.hash.substring(1); // # 제거
    if (!hash) {
      return { path: '/home', params: {} };
    }
    
    // 쿼리 파라미터 분리
    const [path, queryString] = hash.split('?');
    const params = {};
    
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      for (const [key, value] of urlParams.entries()) {
        params[key] = value;
      }
    }
    
    return { path: path || '/home', params };
  }
  
  init() {
    // 해시 변경 이벤트 리스너
    window.addEventListener('hashchange', () => {
      const { path, params } = this.parseHash();
      this.loadPage(path, params);
    });
    
    // 초기 페이지 로드
    // 먼저 해시에서 경로 확인
    let { path, params } = this.parseHash();
    
    // 해시가 없으면 URL 쿼리 파라미터 확인 (기존 링크 호환성)
    if (path === '/home' && !window.location.hash) {
      const urlParams = Utils.getQueryParams();
      if (urlParams.id) {
        // 쿼리 파라미터가 있으면 경로 추론
        const currentPath = window.location.pathname;
        if (currentPath.includes('profile') || currentPath.includes('profile.html')) {
          path = '/profile';
          params = { id: urlParams.id };
        } else if (currentPath.includes('info') || currentPath.includes('info.html')) {
          path = '/info';
          params = { id: urlParams.id };
        } else if (currentPath.includes('mytomodacchi') || currentPath.includes('mytomodacchi.html')) {
          path = '/mytomodacchi';
          params = { id: urlParams.id, idx: urlParams.idx };
        } else if (currentPath.includes('register') || currentPath.includes('register.html')) {
          path = '/register';
        }
      } else {
        // 경로 기반 라우팅 (기존 호환성)
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '/index.html' || currentPath === '/index') {
          path = '/home';
        } else if (currentPath.endsWith('.html')) {
          const basePath = currentPath.replace(/\.html$/, '');
          const pathMap = {
            '/index': '/home',
            '/info': '/info',
            '/profile': '/profile',
            '/register': '/register',
            '/mytomodacchi': '/mytomodacchi',
            '/wheretogo': '/home'
          };
          path = pathMap[basePath] || basePath;
          params = Utils.getQueryParams();
        } else if (currentPath !== '/' && !currentPath.startsWith('/js') && !currentPath.startsWith('/functions') && !currentPath.startsWith('/api')) {
          // 경로가 있으면 해시로 변환
          path = currentPath;
          params = Utils.getQueryParams();
        }
      }
    }
    
    // 해시가 없고 경로가 있으면 해시로 변환
    if (!window.location.hash && path !== '/home') {
      const queryString = Object.keys(params).length > 0 
        ? '?' + new URLSearchParams(params).toString() 
        : '';
      window.location.hash = '#' + path + queryString;
      return;
    }
    
    this.loadPage(path, params);
  }
}

const router = new Router();
