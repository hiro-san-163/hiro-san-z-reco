/* ===================================================
   山行記録 共通ロジック（V2最終版）
   JSONP安全化 + ローディング対応
================================================= */

window.BLOG_URL = window.BLOG_URL || "https://hiro-san-163.blogspot.com";
const MAX_RESULTS = 150;

/* ===================================================
   初期化
================================================= */
function initRecordPage(config) {
  if (!config || !config.pageType || !config.labelContainerId) {
    console.error("RECORD_CONFIG が不正です");
    return;
  }

  window.RECORD_CONFIG = config;

  config._labelSet = new Set();
  renderBreadcrumb(config);
  fetchAllEntries(config, 1);
}

/* ===================================================
   JSONP 取得
================================================= */
function fetchAllEntries(config, startIndex) {

  // ★動的callback生成
  const callbackName = createFeedHandler(startIndex);

  const script = document.createElement("script");

  script.src =
    `${BLOG_URL}/feeds/posts/default` +
    `?alt=json-in-script` +
    `&callback=${callbackName}` +
    `&max-results=${MAX_RESULTS}` +
    `&start-index=${startIndex}`;

  // ★script削除用
  script.dataset.callback = callbackName;

  // ★エラーハンドリング
  script.onerror = function () {

    const loading = document.querySelector(".loading");
    if (loading) loading.remove();

    showError("データの取得に失敗しました。");
  };

  document.body.appendChild(script);
}

/* ===================================================
   フィード処理（動的callback）
================================================= */
function createFeedHandler(startIndex) {

  const callbackName = `feedCallback_${Date.now()}_${startIndex}`;

  window[callbackName] = function (data) {

    const config = window.RECORD_CONFIG;
    const entries = data.feed.entry || [];

    try {

      // ★ローディング削除（成功時）
      const loading = document.querySelector(".loading");
      if (loading) loading.remove();

      entries.forEach(entry => {
        if (!entry.category) return;

        entry.category.forEach(cat => {
          const label = cat.term;

          if (config.excludeLabel && config.excludeLabel(label)) return;

          config._labelSet.add(label);
        });
      });

      // ★ページング
      if (entries.length === MAX_RESULTS) {
        const nextIndex =
          Number(data.feed.openSearch$startIndex.$t) + MAX_RESULTS;

        fetchAllEntries(config, nextIndex);
        return;
      }

      renderLabels(config);
      handleQueryIfExists(config);

    } finally {

      // ★callback削除
      delete window[callbackName];

      // ★script削除
      const scripts = document.querySelectorAll("script");
      scripts.forEach(s => {
        if (s.dataset.callback === callbackName) {
          s.remove();
        }
      });
    }
  };

  return callbackName;
}

/* ===================================================
   ラベル描画
================================================= */
function renderLabels(config) {

  const container = document.getElementById(config.labelContainerId);
  if (!container) return;

  container.innerHTML = "";

  const labels = Array.from(config._labelSet).sort();

  if (labels.length === 0) {
    container.innerHTML =
      "<span class='label-placeholder'>データがありません</span>";
    return;
  }

  labels.forEach(label => {

    const btn = document.createElement("button");
    btn.textContent = label;

    btn.addEventListener("click", () => {
      window.location.href =
        `records/${config.pageType}.html?label=${encodeURIComponent(label)}`;
    });

    container.appendChild(btn);
  });
}

/* ===================================================
   クエリ処理
================================================= */
function handleQueryIfExists(config) {

  const params = new URLSearchParams(location.search);
  const label = params.get("label");

  if (!label) return;

  const listBox = document.getElementById(config.listBoxId);
  if (listBox) listBox.style.display = "block";

  const labelContainer = document.getElementById(config.labelContainerId);
  if (labelContainer) labelContainer.style.display = "none";

  showLatestPosts(label);
}

/* ===================================================
   ラベル別最新5件取得
================================================= */
function showLatestPosts(label) {

  document.getElementById("list-title").textContent =
    `${label} の最新5件`;

  document.getElementById("more-link").href =
    `${BLOG_URL}/search/label/${encodeURIComponent(label)}`;

  const callbackName = "handlePosts";

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default/-/${encodeURIComponent(label)}` +
    `?alt=json-in-script&callback=${callbackName}&max-results=5`;

  document.body.appendChild(script);
}

/* ===================================================
   記事カード描画
================================================= */
function handlePosts(data) {

  const container = document.querySelector("#latest-list ul");
  if (!container) return;

  container.innerHTML = "";
  container.classList.add("latest");

  const entries = data.feed.entry || [];

  if (entries.length === 0) {
    container.innerHTML = "<p>記事が見つかりません</p>";
    return;
  }

  entries.forEach(entry => {

    const title = entry.title.$t;
    const linkObj = entry.link.find(l => l.rel === "alternate");
    const link = linkObj ? linkObj.href : "#";

    const content = entry.content ? entry.content.$t : "";
    const postInfo = extractPostContent(content);

    const article = document.createElement("article");
    article.className = "record-card";

    article.innerHTML = `
      ${postInfo.image ? `
        <img src="${postInfo.image}" class="record-thumb" alt="${title}">
      ` : ""}

      <h3 class="record-title">
        <a href="${link}" target="_blank" rel="noopener">
          ${title}
        </a>
      </h3>

      <div class="record-detail">
        ${postInfo.date ? `<span>実施日：${postInfo.date}</span>` : ""}
        ${postInfo.area ? `<span>山域：${postInfo.area}</span>` : ""}
        ${postInfo.genre ? `<span>ジャンル：${postInfo.genre}</span>` : ""}
      </div>

      ${postInfo.summary ? `
        <div class="record-summary">
          ${postInfo.summary}…
        </div>
      ` : ""}
    `;

    container.appendChild(article);
  });
}

/* ===================================================
   エラー表示
================================================= */
function showError(message) {

  const config = window.RECORD_CONFIG;
  const container = document.getElementById(config.labelContainerId);

  if (!container) return;

  container.innerHTML =
    `<div class="error-message">${message}</div>`;
}

/* ===================================================
   本文解析
================================================= */
function extractPostContent(htmlContent) {

  const temp = document.createElement("div");
  temp.innerHTML = htmlContent;

  const card = temp.querySelector(".rec-card");
  if (!card) return {};

  let date = "", area = "", genre = "";

  const info = card.querySelector(".rec-info");
  if (info) {
    info.querySelectorAll("p").forEach(p => {
      const text = p.innerText.trim();

      if (text.includes("実施日")) {
        date = text.replace("実施日：", "").trim();
      }
      if (text.includes("山域")) {
        area = text.replace("山域：", "").trim();
      }
      if (text.includes("ジャンル")) {
        genre = text.replace("ジャンル：", "").trim();
      }
    });
  }

  const img = card.querySelector(".rec-main-photo img");
  const image = img ? img.src : "";

  const summaryEl = card.querySelector(".rec-summary");
  let summary = summaryEl ? summaryEl.innerText.trim() : "";
  summary = summary.substring(0, 120);

  return { date, area, genre, summary, image };
}

/* ===================================================
   パンくず
================================================= */
function renderBreadcrumb(config) {

  const bc = document.querySelector("nav.breadcrumb");
  if (!bc) return;

  const pageTypeMap = {
    year: "年別",
    genre: "ジャンル別",
    area: "山域別"
  };

  const labelText = pageTypeMap[config.pageType] || "";

  bc.innerHTML = `
    <a href="index.html">ホーム</a>
    <span> &gt; </span>
    <a href="records/index.html">山行記録</a>
    <span> &gt; </span>
    <span>${labelText}</span>
  `;
}