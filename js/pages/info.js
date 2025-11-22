// 의견 남기기 페이지
const InfoPage = {
  render() {
    return `
      <div class="card" style="width: 520px;">
        <h1 id="title"></h1>
        <div class="field">
          <label for="friendName">당신의 이름</label>
          <div class="row">
            <select id="friendIcon" title="아이콘 선택" style="height:40px; border:1px solid rgba(232, 74, 107, 0.3); border-radius:8px; padding:0 8px;">
              <option value="">pick</option>
              <option>🥰</option>
              <option>🫥</option>
              <option>😎</option>
              <option>😝</option>
              <option>😵</option>
              <option>🤪</option>
              <option>😇</option>
              <option>🥳</option>
              <option>🥸</option>
              <option>👻</option>
              <option>🍀</option>
            </select>
            <input id="friendName" type="text" placeholder="당신의 이름을 입력하세요">
          </div>
        </div>
        <div class="field">
          <label for="firstImpression">첫인상</label>
          <textarea id="firstImpression"></textarea>
        </div>
        <div class="field">
          <label for="currentImpression">현 인상</label>
          <textarea id="currentImpression"></textarea>
        </div>
        <div class="actions">
          <button id="submit" class="btn">제출하기</button>
        </div>
        <div id="msg" class="msg"></div>
      </div>
    `;
  },
  
  async init(params) {
    const userId = params.id || '';
    const API_URL = CONFIG.BASE_URL + '/api/opinions';
    
    // userId가 없으면 에러 메시지 표시
    if (!userId) {
      document.getElementById('title').textContent = '오류: 아이디가 없습니다';
      const msg = document.getElementById('msg');
      msg.textContent = '올바른 링크로 접근해주세요.';
      msg.className = 'msg error';
      return;
    }

    // Load user name
    const name = await Utils.getUserName(userId);
    document.getElementById('title').innerHTML = '<i class="fi fi-rr-stars"></i> ' + name + '님에 대한 의견 남기기';
    document.getElementById('firstImpression').placeholder = name + '님을 처음 봤을 때의 인상을 적어주세요';
    document.getElementById('currentImpression').placeholder = '현재 느끼는 ' + name + '님의 인상을 적어주세요';

    const friendName = document.getElementById('friendName');
    const friendIcon = document.getElementById('friendIcon');
    const firstImpression = document.getElementById('firstImpression');
    const currentImpression = document.getElementById('currentImpression');
    const msg = document.getElementById('msg');

    function setMessage(t, type) { 
      msg.textContent = t; 
      msg.className = 'msg ' + (type || ''); 
    }

    document.getElementById('submit').addEventListener('click', async () => {
      const f = (friendName.value || '').trim();
      const fi = (firstImpression.value || '').trim();
      const ci = (currentImpression.value || '').trim();

      if (!f) { setMessage('당신의 이름을 입력하세요.', 'error'); return; }
      if (!fi) { setMessage('첫인상을 입력하세요.', 'error'); return; }
      if (!ci) { setMessage('현 인상을 입력하세요.', 'error'); return; }

      setMessage('제출 중...', 'success');
      
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            friendName: f,
            icon: (friendIcon && friendIcon.value) || '',
            firstImpression: fi,
            currentImpression: ci,
            at: Date.now()
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || '서버 오류가 발생했습니다.');
        }

        const result = await response.json();
        console.log('제출 성공:', result);
        
        setMessage('제출되었습니다. 감사합니다!', 'success');
        
        // profile 페이지로 이동
        setTimeout(() => {
          router.navigate('/profile', { id: userId });
        }, 1000);
      } catch (error) {
        console.error('Error:', error);
        setMessage('제출 중 오류가 발생했습니다: ' + error.message + ' 다시 시도해주세요.', 'error');
      }
    });
  }
};

