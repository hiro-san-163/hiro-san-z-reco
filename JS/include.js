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
const headerPromise = loadPart("header", `parts/header.html?v=${v}`).then(() => {
  initNavToggle();
  setHeaderActive();
});

// footer 読み込み
const footerPromise = loadPart("footer", `parts/footer.html?v=${v}`).then(() => {
  setFooterActive();
});

// ★これが正しい位置＆書き方
window.partsLoaded = Promise.all([headerPromise, footerPromise]);
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
// 現在のページパスに基づいて該当するナビリンクに active クラスを付与
function setHeaderActive() {
  const links = document.querySelectorAll(".global-nav a");
  if (!links.length) return;

  let path = location.pathname;

  // GitHub Pages 環境対応：
  // リポジトリ名 "hiro-san-z-reco" をパスから除去して相対パスとする
  // 例: /hiro-san-z-reco/records/year.html → /records/year.html
  path = path.replace(/^\/hiro-san-z-reco/, "");

  // パスの末尾スラッシュを除去（/records/ → /records）
  // これによりパス比較を統一
  path = path.replace(/\/+$/, "");

  links.forEach(link => {
    link.classList.remove("active");

    const href = link.getAttribute("href");
    if (!href) return;

    // パターン1: ホームページ（トップページ）
    // 相対パスが空、/、またはindex.htmlの場合にマッチ
    if ((path === "" || path === "/" || path === "/index.html") && href === "index.html") {
      link.classList.add("active");
    }

    // パターン2: 山行記録ページ
    // /records/ で始まるすべてのページにマッチ（年別、山域別、ジャンル別etc）
    if (path.startsWith("/records") && href === "records/index.html") {
      link.classList.add("active");
    }

    // パターン3: 山行ログ（ヤマレコ）ページ
    if (path === "/logs/index.html" && href === "logs/index.html") {
      link.classList.add("active");
    }

    // パターン4: Silverboy（ヤマレコ）ページ
    if (path === "/logs/SBindex.html" && href === "logs/SBindex.html") {
      link.classList.add("active");
    }
    
　  // パターン5: ショウタン（ヤマレコ）ページ
    if (path === "/logs/STindex.html" && href === "logs/STindex.html") {
      link.classList.add("active");
    }

    
    // パターン6: その他のシングルページ
    // ブログ、自己紹介、その他ページなど（path と href が一致）
    if (path === "/" + href) {
      link.classList.add("active");
    }
  });
}


// =======================================
// フッターナビ active 判定
// =======================================
// ヘッダーと同じロジックでフッターナビのアクティブ状態を判定・適用
function setFooterActive() {
  const links = document.querySelectorAll(".footer-nav a");
  if (!links.length) return;

  let path = location.pathname;

  // GitHub Pages リポジトリ名と末尾スラッシュを除去してパスを正規化
  path = path.replace(/^\/hiro-san-z-reco/, "");
  path = path.replace(/\/+$/, "");

  links.forEach(link => {
    link.classList.remove("active");

    const href = link.getAttribute("href");
    if (!href) return;

    // ホームページ判定
    if ((path === "" || path === "/" || path === "/index.html") && href === "index.html") {
      link.classList.add("active");
    }

    // 山行記録ページ判定
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
    
    if (path === "/logs/STindex.html" && href === "logs/STindex.html") {
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
  ],

  // ブログ・ひびのこと用（新規追加）
  "blog": [
    { label: "ホーム", url: "index.html" },
    { label: "ひびのこと" }
  ],

  // 自己紹介用（新規追加）
  "about": [
    { label: "ホーム", url: "index.html" },
    { label: "わたしのこと" }
  ],

  // Silverboy（ヤマレコ）用（新規追加）
  "logs-silverboy": [
    { label: "ホーム", url: "index.html" },
    { label: "Silverboy（ヤマレコ）" }
  ],

   // Silverboy（ヤマレコ）用（新規追加）
  "logs-ショウタン": [
    { label: "ホーム", url: "index.html" },
    { label: "ショウタン（ヤマレコ）" }
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
