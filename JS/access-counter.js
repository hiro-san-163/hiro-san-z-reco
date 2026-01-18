document.addEventListener('DOMContentLoaded', () => {
  const counter = document.getElementById('access-counter');
  const countEl = document.getElementById('count');
  
  if (!counter || !countEl) return;

  // トップページ判定（GitHub Pages対応）
  const path = location.pathname;
  const isTopPage =
    path === '/hiro-san-z-reco/' ||
    path === '/hiro-san-z-reco' ||
    path.endsWith('/index.html');

  // トップページ以外は非表示
  if (!isTopPage) {
    counter.style.display = 'none';
    return;
  }

  // CountAPI で PV カウント（毎回カウントアップ）
  const apiUrl = 'https://api.countapi.xyz/hit/hiro-san-z-reco.main/top-page-pv';

  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      if (typeof data.value === 'number') {
        countEl.textContent = data.value.toLocaleString();
      } else {
        countEl.textContent = '—';
      }
    })
    .catch(error => {
      console.error('アクセスカウント取得エラー:', error);
      countEl.textContent = '—';
    });
});

