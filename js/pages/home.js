// 홈 페이지 (시작 페이지)
const HomePage = {
  render() {
    return `
      <div class="wrap">
        <div class="card homeCard">
          <h1>누구의 프로필로 이동할까요?</h1>
          <hr style="margin-top:4px; margin-bottom:24px; border:none; border-top:1px solid rgba(232, 74, 107, 0.3);">
          <div class="field">
            <div class="inputRow">
              <input id="userId" type="text" placeholder="아이디를 입력하세요" autocomplete="username">
              <button id="loginBtn" class="btn inline">go</button>
            </div>
          </div>
        </div>
        <div class="outerActions home">
          <button id="goRegister" class="btn">내 프로필 생성하기</button>
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

  }
};

