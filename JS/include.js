// =======================================
// parts loader（header / footer 共通）
// =======================================
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
const v = "20250215";

// header 読み込み
loadPart("header", `parts/header.html?v=${v}`).then(() => {
  initNavToggle();
});

// footer 読み込み
loadPart("footer", `parts/footer.html?v=${v}`).then(() => {
  setFooterActive();
});

// 既存HTML互換用（削除禁止）
function loadHeaderFooter() {}


// =======================================
// グローバルナビ（スマホ）トグル
// =======================================
function initNavToggle() {
  const toggleBtn = document.getElementById("nav-toggle");
  const mainNav   = document.getElementById("main-nav");

  if (!toggleBtn || !mainNav) return;

  toggleBtn.addEventListener("click", ev => {
    ev.preventDefault();
    mainNav.classList.toggle("nav-active");
  });

  document.addEventListener("click", ev => {
    if (!ev.target.closest("#nav-toggle") &&
        !ev.target.closest("#main-nav")) {
      mainNav.classList.remove("nav-active");
    }
  });
}


// =======================================
// フッターナビ active 自動判定（最終版）
// =======================================
function setFooterActive() {
  const links = document.querySelectorAll(".footer-nav a");
  if (!links.length) return;

  // 末尾スラッシュ除去
  const path = location.pathname.replace(/\/+$/, "");

  links.forEach(link => {
    link.classList.remove("active");

    const href = link.getAttribute("href");
    if (!href) return;

    // ===== Home =====
    if (
      (path === "" || path === "/" || path.endsWith("/index.html")) &&
      href === "index.html"
    ) {
      link.classList.add("active");
    }

    // ===== records 配下 =====
    else if (
      path.startsWith("/records") &&
      href.startsWith("records/")
    ) {
      link.classList.add("active");
    }

    // ===== logs 配下 =====
    else if (
      path.startsWith("/logs") &&
      href.startsWith("logs/")
    ) {
      link.classList.add("active");
    }

    // ===== 単独ページ =====
    else if (path.endsWith("/" + href)) {
      link.classList.add("active");
    }
  });
}


// =======================================
// breadcrumb 共通描画
// =======================================
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


// =======================================
// breadcrumb 定義
// =======================================
const BREADCRUMB_MAP = {

  home: [
    { label: "ホーム" }
  ],

  "records-index": [
    { label: "ホーム", url: "index.html" },
    { label: "山行記録" }
  ],

  "records-year": [
    { label: "ホーム", url: "index.html" },
    { label: "山行記録", url: "records/index.html" },
    { label: "年別" }
  ],

  "records-area": [
    { label: "ホーム", url: "index.html" },
    { label: "山行記録", url: "records/index.html" },
    { label: "山域別" }
  ],

  "records-genre": [
    { label: "ホーム", url: "index.html" },
    { label: "山行記録", url: "records/index.html" },
    { label: "ジャンル別" }
  ],

  "logs-index": [
    { label: "ホーム", url: "index.html" },
    { label: "山行ログ（ヤマレコ）" }
  ]
};


// =======================================
// breadcrumb セット
// =======================================
function setBreadcrumb(key) {
  const items = BREADCRUMB_MAP[key];
  if (!items) {
    console.warn("Breadcrumb 未定義:", key);
    return;
  }
  renderBreadcrumb(items);
}
