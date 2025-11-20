// 유틸리티 함수들
const Utils = {
  // localStorage 관련
  loadIds() {
    try { return JSON.parse(localStorage.getItem('registeredIds') || '[]'); }
    catch (e) { return []; }
  },
  
  saveIds(ids) {
    localStorage.setItem('registeredIds', JSON.stringify(ids));
  },
  
  loadNameMap() {
    try { return JSON.parse(localStorage.getItem('idToName') || '{}'); }
    catch (e) { return {}; }
  },
  
  saveNameMap(map) {
    localStorage.setItem('idToName', JSON.stringify(map));
  },
  
  loadPasswordMap() {
    try { return JSON.parse(localStorage.getItem('idToPassword') || '{}'); }
    catch (e) { return {}; }
  },
  
  savePasswordMap(map) {
    localStorage.setItem('idToPassword', JSON.stringify(map));
  },
  
  // API 관련
  async getUser(userId) {
    try {
      const response = await fetch(CONFIG.BASE_URL + '/api/users?userId=' + encodeURIComponent(userId));
      if (response.ok) {
        const data = await response.json();
        return data.user || null;
      }
    } catch (e) {
      console.error('API error:', e);
    }
    return null;
  },
  
  async getUserName(userId) {
    const user = await this.getUser(userId);
    if (user && user.name) return user.name;
    
    const map = this.loadNameMap();
    return map[userId] || '(이름 미확인)';
  },
  
  // URL 파라미터 파싱
  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      id: params.get('id') || '',
      idx: parseInt(params.get('idx') || '-1', 10),
      name: params.get('name') || ''
    };
  },
  
  // 조사 처리
  hasFinalConsonant(str) {
    if (!str || str.length === 0) return false;
    const lastChar = str[str.length - 1];
    const code = lastChar.charCodeAt(0);
    return (code >= 0xAC00 && code <= 0xD7A3) && ((code - 0xAC00) % 28 !== 0);
  },
  
  getJosa(name) {
    const hasJosa = this.hasFinalConsonant(name);
    return hasJosa ? name + '이' : name + '가';
  }
};

