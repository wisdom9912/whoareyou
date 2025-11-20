// 홈 페이지 (시작 페이지)
const HomePage = {
  render() {
    return `
      <div class="card">
        <h1>누구의 프로필로 이동할까요?</h1>
        <div class="field">
          <label for="userId">아이디</label>
          <div class="inputRow">
            <input id="userId" type="text" placeholder="아이디를 입력하세요" autocomplete="username">
            <button id="loginBtn" class="btn inline">go</button>
          </div>
        </div>
        <div class="actions">
          <button id="goRegister" class="btn">내 프로필 생성하기</button>
          <div style="margin-top:8px"></div>
          <button id="clearData" class="btn" style="background:#dc2626">데이터 초기화</button>
        </div>
      </div>
    `;
  },
  
  init() {
    document.getElementById('goRegister').addEventListener('click', () => {
      router.navigate('/register');
    });

    document.getElementById('loginBtn').addEventListener('click', async () => {
      const userIdInput = document.getElementById('userId');
      const userId = (userIdInput.value || '').trim();
      if (!userId) { 
        alert('아이디를 입력하세요.'); 
        return; 
      }
      
      // 마스터 테스트 아이디 처리
      if (userId === 'qwe123') {
        router.navigate('/profile', { id: userId });
        return;
      }
      
      try {
        // KV에서 사용자 정보 조회
        const response = await fetch(CONFIG.BASE_URL + '/api/users?userId=' + encodeURIComponent(userId));
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // 사용자 정보가 KV에 있으면 프로필 페이지로 이동
            router.navigate('/profile', { id: userId });
            return;
          }
        }
        
        // 사용자를 찾을 수 없음
        alert('등록되지 않은 아이디입니다. 회원가입을 진행해주세요.');
      } catch (e) {
        console.error('API error:', e);
        alert('서버 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    });

    document.getElementById('clearData').addEventListener('click', async () => {
      if (!confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
      }
      
      try {
        // Delete from KV
        try {
          const response = await fetch(CONFIG.BASE_URL + '/api/users', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          if (response.ok) {
            console.log('KV 데이터 삭제 완료');
          }
        } catch (e) {
          console.error('KV 삭제 오류:', e);
        }
        
        // Delete from localStorage
        localStorage.removeItem('registeredIds');
        localStorage.removeItem('idToName');
        localStorage.removeItem('idToPassword');
        const toRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.indexOf('opinions:') === 0 || k.indexOf('opinionGuess:') === 0)) {
            toRemove.push(k);
          }
        }
        toRemove.forEach(k => localStorage.removeItem(k));
        alert('등록된 모든 데이터가 삭제되었습니다.');
      } catch (e) {
        alert('데이터 삭제 중 오류가 발생했습니다. 브라우저 저장소 권한을 확인하세요.');
      }
    });
  }
};

