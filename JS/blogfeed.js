/* ===================================================
   blogfeed.js（安全版・完成）
   トップページ／records/index.html 専用
   Blogger JSONP から最新山行記録を取得・表示
================================================== */

/* ===================================================
   設定層（Config Layer）
================================================== */
const BLOGFEED_CONFIG = {
  BLOG_URL: "https://hiro-san-163.blogspot.com",
  MAX_RESULTS: 5,
  TARGET_ID: "latest-records",
  LOADING_ID: "latest-loading",
  TIMEOUT_MS: 8000
};

/* ===================================================
   初期化層（Init Layer）
================================================== */
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById(BLOGFEED_CONFIG.TARGET_ID);
  if (!container) {
    console.warn("[blogfeed] 表示対象が存在しません");
    return;
  }

  showLoading();
  fetchLatestPosts();
});

/* ===================================================
   データ取得層（Fetch Layer）
================================================== */
function fetchLatestPosts() {
  const callbackName = "handleBlogFeedSafe";

  // コールバック登録
  window[callbackName] = data => {
    clearTimeout(window.__blogfeedTimeout);
    try {
      renderPosts(data);
    } catch (e) {
      console.error("[blogfeed] 描画エラー", e);
      showError("表示に失敗しました");
    } finally {
      cleanup(callbackName);
    }
  };

  // JSONP script 作成
  const script = document.createElement("script");
  script.src =
    `${BLOGFEED_CONFIG.BLOG_URL}/feeds/posts/default` +
    `?alt=json-in-script` +
    `&callback=${callbackName}` +
    `&max-results=${BLOGFEED_CONFIG.MAX_RESULTS}`;

  script.onerror = () => {
    showError("通信エラーが発生しました");
    cleanup(callbackName);
  };

  document.body.appendChild(script);

  // タイムアウト保険
  window.__blogfeedTimeout = setTimeout(() => {
    showError("応答がありませんでした");
    cleanup(callbackName);
  }, BLOGFEED_CONFIG.TIMEOUT_MS);
}

/* ===================================================
   描画層（Render Layer）
================================================== */
function renderPosts(data) {
  const container = document.getElementById(BLOGFEED_CONFIG.TARGET_ID);
  if (!container) return;

  const entries = data?.feed?.entry || [];

  container.innerHTML = "";

  if (entries.length === 0) {
    container.innerHTML = "<p>山行記録がありません</p>";
    hideLoading();
    return;
  }

  entries.forEach(entry => {
    const title = entry.title.$t;
    const link = entry.link.find(l => l.rel === "alternate").href;
    const date = new Date(entry.published.$t).toLocaleDateString("ja-JP");

    const card = document.createElement("article");
    card.className = "record-card";

    card.innerHTML = `
      <div class="record-card__date">${date}</div>
      <h3 class="record-card__title">
        <a href="${link}" target="_blank" rel="noopener">${title}</a>
      </h3>
    `;

    container.appendChild(card);
  });

  hideLoading();
}

/* ===================================================
   UI補助層（UI Helper）
================================================== */
function showLoading() {
  const el = document.getElementById(BLOGFEED_CONFIG.LOADING_ID);
  if (el) el.style.display = "block";
}

function hideLoading() {
  const el = document.getElementById(BLOGFEED_CONFIG.LOADING_ID);
  if (el) el.style.display = "none";
}

function showError(message) {
  const container = document.getElementById(BLOGFEED_CONFIG.TARGET_ID);
  if (!container) return;

  container.innerHTML = `<p class="error">${message}</p>`;
  hideLoading();
}

/* ===================================================
   クリーンアップ
================================================== */
function cleanup(callbackName) {
  try {
    delete window[callbackName];
  } catch (_) {}
}
