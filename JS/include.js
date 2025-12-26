function loadPart(id, url) {
  return fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Failed load: " + url);
      return res.text();
    })
    .then(html => {
      const target = document.getElementById(id);
      if (target) target.innerHTML = html;
      return html;
    })
    .catch(err => console.error(err));
}

// キャッシュ対策
const v = "20250210";

// header / footer 読み込み
loadPart("header", "parts/header.html?v=${v}").then(() => {
  initNavToggle();
});
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
//breadcrum 共通化

function renderBreadcrumb(items) {
  const nav = document.querySelector(".breadcrumb");
  if (!nav) return;

  let html = "<ul>";

  items.forEach((item, index) => {
    if (item.url && index !== items.length - 1) {
      html += `<li><a href="${item.url}">${item.label}</a></li>`;
    } else {
      html += `<li>${item.label}</li>`;
    }
  });

  html += "</ul>";
  nav.innerHTML = html;
}
// ================================
// breadcrumb 最終共通定義
// ================================

const SITE_ROOT = "/hiro-san-z-reco/";

const BREADCRUMB_MAP = {
  "home": [
    { label: "ホーム" }
  ],

  "records": [
    { label: "ホーム", url: SITE_ROOT },
    { label: "山行記録" }
  ],

  "records-year": [
    { label: "ホーム", url: SITE_ROOT },
    { label: "山行記録", url: SITE_ROOT + "records/" },
    { label: "年別" }
  ],

  "records-area": [
    { label: "ホーム", url: SITE_ROOT },
    { label: "山行記録", url: SITE_ROOT + "records/" },
    { label: "山域別" }
  ],

  "records-genre": [
    { label: "ホーム", url: SITE_ROOT },
    { label: "山行記録", url: SITE_ROOT + "records/" },
    { label: "ジャンル別" }
  ]
};

function setBreadcrumb(key) {
  const items = BREADCRUMB_MAP[key];
  if (!items) {
    console.warn("Breadcrumb 未定義:", key);
    return;
  }
  renderBreadcrumb(items);
}

BREADCRUMB_MAP["logs-index"] = [
  { label: "ホーム", url: "/" },
  { label: "山行ログ（ヤマレコ）" }
];
