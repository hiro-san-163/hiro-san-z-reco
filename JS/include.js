// =======================================
// parts loader（header / footer 共通）
// =======================================
function loadPart(id, url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        const target = document.getElementById(id);
        if (target) target.innerHTML = xhr.responseText;
        resolve(xhr.responseText);
      } else {
        reject(new Error("Failed load: " + url + " status: " + xhr.status));
      }
    };
    xhr.onerror = function() {
      reject(new Error("Failed load: " + url));
    };
    xhr.send();
  });
}

// キャッシュ対策
const v = "20250226";

// header 読み込み
loadPart("header", `parts/header.html?v=${v}`).then(() => {
  initNavToggle();
  setHeaderActive(); // ← 追加
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
    if (
      !ev.target.closest("#nav-toggle") &&
      !ev.target.closest("#main-nav")
    ) {
      mainNav.classList.remove("nav-active");
    }
  });
}


// =======================================
// ヘッダーナビ active 判定（追加）
// =======================================
function setHeaderActive() {
  const links = document.querySelectorAll(".global-nav a");
  if (!links.length) return;

  let path = location.pathname;

  // GitHub Pages リポジトリ名除去
  path = path.replace(/^\/hiro-san-z-reco/, "");

  // 末尾スラッシュ除去
  path = path.replace(/\/+$/, "");

  links.forEach(link => {
    link.classList.remove("active");

    const href = link.getAttribute("href");
    if (!href) return;

    // home
    if ((path === "" || path === "/" || path === "/index.html") && href === "index.html") {
      link.classList.add("active");
    }

    // records
    if (path.startsWith("/records") && href === "records/index.html") {
      link.classList.add("active");
    }

    // logs
    if (path === "/logs/index.html" && href === "logs/index.html") {
      link.classList.add("active");
    }

    if (path === "/logs/SBindex.html" && href === "logs/SBindex.html") {
      link.classList.add("active");
    }

    // single
    if (path === "/" + href) {
      link.classList.add("active");
    }
  });
}


// =======================================
// フッターナビ active 判定
// =======================================
function setFooterActive() {
  const links = document.querySelectorAll(".footer-nav a");
  if (!links.length) return;

  let path = location.pathname;

  path = path.replace(/^\/hiro-san-z-reco/, "");
  path = path.replace(/\/+$/, "");

  links.forEach(link => {
    link.classList.remove("active");

    const href = link.getAttribute("href");
    if (!href) return;

    // home
    if ((path === "" || path === "/" || path === "/index.html") && href === "index.html") {
      link.classList.add("active");
    }

    // records
    if (path.startsWith("/records") && href === "records/index.html") {
      link.classList.add("active");
    }

    // logs
    if (path === "/logs/index.html" && href === "logs/index.html") {
      link.classList.add("active");
    }

    if (path === "/logs/SBindex.html" && href === "logs/SBindex.html") {
      link.classList.add("active");
    }

    // single
    if (path === "/" + href) {
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