document.addEventListener('DOMContentLoaded', () => {

  const counter = document.getElementById('access-counter');
  const countEl = document.getElementById('count');
  if (!counter || !countEl) return;

  // トップページ判定（GitHub Pages完全対応）
  const path = location.pathname;
  const isTopPage =
    path === '/hiro-san-z-reco/' ||
    path === '/hiro-san-z-reco' ||
    path.endsWith('/index.html');

  if (!isTopPage) {
    counter.style.display = 'none';
    return;
  }

  // CountAPI
  const apiUrl =
    'https://api.countapi.xyz/hit/hiro-san-z-reco/index-pv';

  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      if (typeof data.value === 'number') {
        countEl.textContent = data.value.toLocaleString();
      } else {
        countEl.textContent = '—';
      }
    })
    .catch(() => {
      countEl.textContent = '—';
    });

});

