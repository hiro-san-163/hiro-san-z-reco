function loadPart(id, url) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Failed load: " + url);
      return res.text();
    })
    .then(html => {
      const target = document.getElementById(id);
      if (target) target.innerHTML = html;
    })
    .catch(err => console.error(err));
}

// キャッシュ対策
const v = "20250210";

// header / footer 読み込み
loadPart("header", "parts/header.html?v=${v}");
loadPart("footer", "parts/footer.html?v=${v}");

// ヘッダ・フッタを読み込み
function loadHeaderFooter() {
  // すでに読み込んでいるので何もしない
}

// ナビゲーション トグル初期化
function initNavToggle() {
  const toggleBtn = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  if (!toggleBtn || !mainNav) {
    console.warn('ナビゲーション要素が見つかりません');
    return;
  }

  toggleBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    mainNav.classList.toggle('nav-active');
  });

  // 外側クリックでナビを閉じる
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#nav-toggle') && !ev.target.closest('#main-nav')) {
      mainNav.classList.remove('nav-active');
    }
  });
}
