// 제출폼 보기 페이지
const MyTomodacchiPage = {
  render() {
    return `
      <div class="card" style="width: 640px;">
        <div class="header"><span id="left"></span><span id="right" class="right"></span></div>
        <div class="section">
          <h2>첫인상</h2>
          <div id="first" class="box"></div>
        </div>
        <div class="section">
          <h2>현 인상</h2>
          <div id="current" class="box"></div>
        </div>
        <div class="section" id="guessSection">
          <h2>나는 누구일까요?</h2>
          <div class="row">
            <input id="guessInput" type="text" placeholder="이 사람이 누구인지 입력하세요">
            <input id="passwordInput" type="password" class="password" placeholder="비밀번호" maxlength="4" pattern="[0-9]{4}">
            <button id="guessBtn" class="btnGuess">입력</button>
          </div>
          <div id="guessInfo" class="subtle"></div>
          <div id="passwordError" class="errorMsg"></div>
        </div>
        <div class="section" id="fixedGuessSection" style="display:none;">
          <h2 id="fixedGuessTitle"></h2>
          <div id="fixedGuess" class="box"></div>
        </div>
        <div id="answerSection" class="section" style="display:none;">
          <h2>정답은?</h2>
          <div id="answer" class="box"></div>
        </div>
        <div class="actions">
          <button id="back" class="btn">다른 친구 확인하기</button>
        </div>
      </div>
    `;
  },
  
  async init(params) {
    const userId = params.id || '';
    const idx = params.idx !== undefined ? parseInt(params.idx, 10) : -1;
    
    async function loadOpinions() {
      try {
        const response = await fetch(CONFIG.BASE_URL + '/api/opinions?userId=' + encodeURIComponent(userId));
        if (!response.ok) {
          throw new Error('API 요청 실패: ' + response.status);
        }
        const data = await response.json();
        return data.opinions || [];
      } catch (e) {
        console.error('Error loading opinions:', e);
        throw e;
      }
    }
    
    async function loadGuess() {
      try {
        const response = await fetch(CONFIG.BASE_URL + '/api/guesses?userId=' + encodeURIComponent(userId) + '&idx=' + idx);
        if (response.ok) {
          const data = await response.json();
          return data.guess || null;
        }
        return null;
      } catch (e) {
        console.error('Error loading guess:', e);
        return null;
      }
    }
    
    async function saveGuess(guess) {
      try {
        const response = await fetch(CONFIG.BASE_URL + '/api/guesses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            idx: idx,
            guess: guess
          })
        });
        
        if (!response.ok) {
          throw new Error('추측 저장 실패');
        }
        
        return true;
      } catch (e) {
        console.error('Error saving guess:', e);
        throw e;
      }
    }

    // Load account name
    const accountName = await Utils.getUserName(userId);
    
    const guessSection = document.getElementById('guessSection');
    const fixedSection = document.getElementById('fixedGuessSection');
    const fixedGuessEl = document.getElementById('fixedGuess');
    const fixedGuessTitleEl = document.getElementById('fixedGuessTitle');
    const guessInfo = document.getElementById('guessInfo');
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const leftHeaderEl = document.getElementById('left');

    async function verifyPassword(password) {
      // Try to verify password from API first
      try {
        const response = await fetch(CONFIG.BASE_URL + '/api/users?userId=' + encodeURIComponent(userId) + '&checkPassword=' + encodeURIComponent(password));
        if (response.ok) {
          const data = await response.json();
          return data.valid === true;
        }
      } catch (e) {
        console.error('API error, trying localStorage:', e);
      }
      
      // Fallback to localStorage
      try {
        const passwordMap = Utils.loadPasswordMap();
        return passwordMap[userId] === password;
      } catch (e) {
        return false;
      }
    }

    function lockGuess(guess, friendName) {
      fixedGuessEl.textContent = guess;
      const accountJosa = Utils.getJosa(accountName);
      fixedGuessTitleEl.textContent = accountJosa + ' 입력한 답';
      guessSection.style.display = 'none';
      fixedSection.style.display = '';
      const ansSec = document.getElementById('answerSection');
      ansSec.style.display = '';
      if (friendName && friendName !== '???') {
        const friendJosa = Utils.getJosa(friendName);
        leftHeaderEl.textContent = friendJosa + ' 생각하는';
      }
    }

    function updateUI(item, savedGuess) {
      const friendName = item.friendName || '???';
      document.getElementById('left').textContent = '???가 생각하는';
      document.getElementById('right').textContent = accountName;
      document.getElementById('first').textContent = item.firstImpression || '';
      document.getElementById('current').textContent = item.currentImpression || '';
      document.getElementById('answer').textContent = friendName;

      if (savedGuess) {
        lockGuess(savedGuess, friendName);
      }
    }

    // Load opinions and guess asynchronously and update UI
    Promise.all([loadOpinions(), loadGuess()]).then((results) => {
      const opinions = results[0];
      const savedGuess = results[1];
      const item = opinions[idx] || {};
      updateUI(item, savedGuess);
    }).catch((err) => {
      console.error('Error:', err);
      document.getElementById('first').textContent = '데이터를 불러오는 중 오류가 발생했습니다.';
      document.getElementById('current').textContent = '잠시 후 다시 시도해주세요.';
    });

    passwordInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      passwordError.textContent = '';
    });

    document.getElementById('guessBtn').addEventListener('click', async () => {
      const input = document.getElementById('guessInput');
      const password = (passwordInput.value || '').trim();
      const val = (input.value || '').trim();

      if (!password) {
        passwordError.textContent = '비밀번호를 입력하세요.';
        guessInfo.textContent = '';
        return;
      }
      if (password.length !== 4) {
        passwordError.textContent = '비밀번호는 4자리 숫자여야 합니다.';
        guessInfo.textContent = '';
        return;
      }
      if (!/^[0-9]{4}$/.test(password)) {
        passwordError.textContent = '비밀번호는 숫자만 입력 가능합니다.';
        guessInfo.textContent = '';
        return;
      }

      const isValidPassword = await verifyPassword(password);
      if (!isValidPassword) {
        passwordError.textContent = '비밀번호가 일치하지 않습니다. 답을 맞출 수 없습니다.';
        guessInfo.textContent = '';
        return;
      }

      if (!val) {
        passwordError.textContent = '';
        guessInfo.textContent = '이름을 입력하세요.';
        return;
      }

      try {
        passwordError.textContent = '';
        guessInfo.textContent = '저장 중...';
        
        // Save guess to Cloudflare
        await saveGuess(val);
        
        // Get the current item to pass friendName
        const opinions = await loadOpinions();
        const currentItem = opinions[idx] || {};
        lockGuess(val, currentItem.friendName);
        guessInfo.textContent = '';
      } catch (e) {
        console.error('Error saving guess:', e);
        guessInfo.textContent = '저장 중 오류가 발생했습니다. 다시 시도해주세요.';
      }
    });

    document.getElementById('back').addEventListener('click', () => {
      router.navigate('/profile', { id: userId });
    });
  }
};

