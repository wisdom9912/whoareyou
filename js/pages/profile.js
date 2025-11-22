// 프로필 페이지
const ProfilePage = {
  render() {
    return `
      <div class="wrap">
        <div class="card" style="width: 540px;">
          <div class="titleRow">
            <h1 id="title"></h1>
            <button id="share" type="button" class="btn btnShare btnFriendCollection">친구수집</button>
          </div>
          <hr style="margin-top:12px; border:none; border-top:1px solid rgba(232, 74, 107, 0.3);">
          <div id="msg" class="msg"></div>
          <div id="opinions" class="list"></div>
        </div>
        <div class="outerActions">
          <button id="createMine" class="btn">내 프로필 생성하기</button>
        </div>
        <div class="outerActions">
          <button id="goBack" class="btn secondary">뒤로가기</button>
        </div>
      </div>
    `;
  },
  
  async init(params) {
    const userId = params.id || '';
    const msg = document.getElementById('msg');

    function setMsg(t) { msg.textContent = t; }

    // Load user name
    const name = await Utils.getUserName(userId);
    document.getElementById('title').textContent = name + '은 어떤 사람인가요?';

    // 친구수집 버튼 클릭 핸들러
    document.getElementById('share').onclick = async (e) => {
      e.preventDefault();
      if (!userId) {
        setMsg('아이디가 없습니다.');
        return false;
      }
      // 현재 호스트와 해시 라우팅을 사용한 info 페이지 링크 생성
      const baseUrl = window.location.origin;
      const targetUrl = baseUrl + '/#/info?id=' + encodeURIComponent(userId);
      try {
        await navigator.clipboard.writeText(targetUrl);
        setMsg('링크가 복사되었습니다!');
      } catch(err) {
        // 클립보드 API 실패 시 대체 방법
        const textArea = document.createElement('textarea');
        textArea.value = targetUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setMsg('링크가 복사되었습니다!');
        } catch(copyErr) {
          setMsg('복사 실패. 링크: ' + targetUrl);
        }
        document.body.removeChild(textArea);
      }
      return false;
    };

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
        // 에러 발생 시 빈 배열 반환 (화면 깨짐 방지)
        return [];
      }
    }
    
    async function loadGuess(userId, idx) {
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

    async function renderOpinionButtons() {
      const container = document.getElementById('opinions');
      container.innerHTML = '<div style="text-align:center; padding:20px; color:#E84A6B;">로딩 중...</div>';
      
      try {
        const list = await loadOpinions();
        
        container.innerHTML = '';
        
        // qwe123 테스트용 예시 버튼 7개 추가
        if (userId === 'qwe123') {
          const testIcons = ['🥰', '🫥', '😎', '😝', '😵', '🤪', '😇'];
          for (let i = 0; i < 7; i++) {
            const testBtn = document.createElement('button');
            testBtn.className = 'btnItem';
            testBtn.textContent = testIcons[i] + ' 테스트' + (i + 1);
            testBtn.addEventListener('click', () => {
              router.navigate('/mytomodacchi', { id: userId, idx: i });
            });
            container.appendChild(testBtn);
          }
          return;
        }
        
        if (list.length === 0) {
          const emptyMsg = document.createElement('div');
          emptyMsg.style.cssText = 'grid-column: 1 / -1; display: flex; justify-content: flex-end; align-items: center; color: #E84A6B; font-size: 14px; padding: 40px 20px; line-height: 1.6; width: 100%;';
          emptyMsg.innerHTML = '<div style="text-align: center;"><div style="font-size: 18px; margin-bottom: 8px;">↑</div><div>친구수집을 클릭해<br>링크를 복사해 보세요!</div></div>';
          container.appendChild(emptyMsg);
          return;
        }
        
        // Load all guesses in parallel
        const guessPromises = list.map((item, idx) => loadGuess(userId, idx));
        const guesses = await Promise.all(guessPromises);
        
        // 중복 제거: 각 항목의 전체 내용으로 고유성 확인
        const seen = new Map();
        const uniqueItems = [];
        
        list.forEach((item, idx) => {
          const hasGuess = !!guesses[idx];
          const icon = item.icon || '';
          const nameLabel = hasGuess && item.friendName ? item.friendName : '';
          
          // 고유 키 생성: icon + friendName + firstImpression + currentImpression 조합
          const uniqueKey = [
            icon || '',
            nameLabel || '',
            item.firstImpression || '',
            item.currentImpression || ''
          ].join('|');
          
          // 중복되지 않은 항목만 추가 (첫 번째로 나타난 항목의 인덱스 사용)
          if (!seen.has(uniqueKey)) {
            seen.set(uniqueKey, idx);
            uniqueItems.push({ item, idx, hasGuess, icon, nameLabel });
          }
        });
        
        // 고유한 항목들만 버튼으로 표시
        uniqueItems.forEach(({ item, idx, hasGuess, icon, nameLabel }) => {
          let label = '';
          if (nameLabel) {
            label = icon ? (icon + ' ' + nameLabel) : nameLabel;
          } else {
            label = icon ? icon : '?';
          }
          const btn = document.createElement('button');
          btn.className = 'btnItem';
          btn.textContent = label;
          btn.addEventListener('click', () => {
            router.navigate('/mytomodacchi', { id: userId, idx: idx });
          });
          container.appendChild(btn);
        });
      } catch (err) {
        console.error('Error rendering opinions:', err);
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#F25675;">데이터를 불러오는 중 오류가 발생했습니다.<br>잠시 후 다시 시도해주세요.</div>';
      }
    }

    renderOpinionButtons();

    document.getElementById('createMine').addEventListener('click', () => {
      router.navigate('/register');
    });

    document.getElementById('goBack').addEventListener('click', () => {
      router.navigate('/home');
    });
  }
};

