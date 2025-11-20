// 회원가입 페이지
const RegisterPage = {
  render() {
    return `
      <div class="card">
        <h1>회원 정보 입력</h1>
        <div class="field">
          <label for="name">이름</label>
          <input id="name" type="text" placeholder="이름을 입력하세요" autocomplete="name">
        </div>
        <div class="field">
          <label for="userId">아이디</label>
          <input id="userId" type="text" placeholder="아이디를 입력하세요" autocomplete="username">
        </div>
        <div class="field">
          <label for="password">비밀번호</label>
          <div class="hint">친구 이름을 맞출 때 사용됩니다</div>
          <input id="password" type="password" placeholder="4자리 숫자" maxlength="4" pattern="[0-9]{4}">
        </div>
        <div class="actions">
          <button id="submit" class="btn">등록</button>
          <button id="back" class="btn secondary">뒤로</button>
        </div>
        <div id="msg" class="message"></div>
      </div>
    `;
  },
  
  init() {
    const nameInput = document.getElementById('name');
    const idInput = document.getElementById('userId');
    const passwordInput = document.getElementById('password');
    const msg = document.getElementById('msg');

    function setMessage(text, type) {
      msg.textContent = text;
      msg.className = 'message ' + (type || '');
    }

    passwordInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    document.getElementById('submit').addEventListener('click', async () => {
      const name = (nameInput.value || '').trim();
      const userId = (idInput.value || '').trim();
      const password = (passwordInput.value || '').trim();

      if (!name) { setMessage('이름을 입력하세요.', 'error'); return; }
      if (!userId) { setMessage('아이디를 입력하세요.', 'error'); return; }
      if (!password) { setMessage('비밀번호를 입력하세요.', 'error'); return; }
      if (password.length !== 4) { setMessage('비밀번호는 4자리 숫자여야 합니다.', 'error'); return; }
      if (!/^[0-9]{4}$/.test(password)) { setMessage('비밀번호는 숫자만 입력 가능합니다.', 'error'); return; }

      // Check duplicate in localStorage first (for quick feedback)
      const ids = Utils.loadIds();
      if (ids.includes(userId)) {
        setMessage('이미 등록된 아이디입니다. 다른 아이디를 사용하세요.', 'error');
        return;
      }

      setMessage('등록 중...', 'success');

      try {
        // Register user via API (saves to KV)
        const response = await fetch(CONFIG.BASE_URL + '/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            name: name,
            password: password
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error && errorData.error.includes('이미 등록된')) {
            setMessage('이미 등록된 아이디입니다. 다른 아이디를 사용하세요.', 'error');
          } else {
            throw new Error(errorData.message || '회원가입 실패');
          }
          return;
        }

        // Also save to localStorage for backward compatibility
        ids.push(userId);
        Utils.saveIds(ids);
        const map = Utils.loadNameMap();
        map[userId] = name;
        Utils.saveNameMap(map);
        const passwordMap = Utils.loadPasswordMap();
        passwordMap[userId] = password;
        Utils.savePasswordMap(passwordMap);

        setMessage('등록이 완료되었습니다! 페이지로 이동합니다...', 'success');
        setTimeout(() => {
          router.navigate('/profile', { id: userId });
        }, 400);
      } catch (error) {
        console.error('Registration error:', error);
        setMessage('등록 중 오류가 발생했습니다: ' + error.message, 'error');
      }
    });

    document.getElementById('back').addEventListener('click', () => {
      router.navigate('/home');
    });
  }
};

