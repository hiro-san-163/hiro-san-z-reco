document.addEventListener('DOMContentLoaded', () => {

  const counter = document.getElementById('access-counter');
  if (!counter) return;

  // パス末尾の / を除去して正規化
  const path = location.pathname.replace(/\/+$/, '');

  // トップページ判定
  // /hiro-san-z-reco/
  // /hiro-san-z-reco/index.html
  if (
    path !== '/hiro-san-z-reco' &&
    path !== '/hiro-san-z-reco/index.html'
  ) {
    counter.style.display = 'none';
    return;
  }

  // CountAPI（トップページPV）
  const apiUrl = 'https://api.countapi.xyz/hit/hiro-san-z-reco/index-pv';

  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('CountAPI request failed');
      }
      return response.json();
    })
    .then(data => {
      const countEl = document.getElementById('count');
      if (countEl && typeof data.value === 'number') {
        countEl.textContent = data.value.toLocaleString();
      }
    })
    .catch(() => {
      const countEl = document.getElementById('count');
      if (countEl) {
        countEl.textContent = '—';
      }
    });

});

