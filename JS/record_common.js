/* ===================================================
   山行記録 共通ロジック
   year / genre / area 共通利用
   Blogger API（JSONP）で全ラベルを取得・表示
================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";
const MAX_RESULTS = 150;

/* ===================================================
   メイン初期化関数
================================================= */
function initRecordPage(config) {
  if (!config || !config.pageType || !config.labelContainerId) {
    console.error("RECORD_CONFIG が不正です");
    return;
  }

  window.RECORD_CONFIG = config;
  createFeedHandler(config.pageType);
  config._labelSet = new Set();
  renderBreadcrumb(config);
  fetchAllEntries(config, 1);
}

/* ===================================================
   全エントリー取得（JSONP ページング対応）
================================================= */
function fetchAllEntries(config, startIndex) {
  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default` +
    `?alt=json-in-script` +
    `&callback=handleFeed_${config.pageType}` +
    `&max-results=${MAX_RESULTS}` +
    `&start-index=${startIndex}`;

  document.body.appendChild(script);
}

/* ===================================================
   JSONP コールバック生成
   取得データからラベルを抽出
================================================= */
function createFeedHandler(pageType) {
  window[`handleFeed_${pageType}`] = function (data) {
    const config = window.RECORD_CONFIG;
    const entries = data.feed.entry || [];

    // ラベルを抽出
    entries.forEach(entry => {
      if (!entry.category) return;
      entry.category.forEach(cat => {
        const label = cat.term;
        if (config.excludeLabel && config.excludeLabel(label)) return;
        config._labelSet.add(label);
      });
    });

    // ページング継続判定
    if (entries.length === MAX_RESULTS) {
      const nextIndex =
        Number(data.feed.openSearch$startIndex.$t) + MAX_RESULTS;
      fetchAllEntries(config, nextIndex);
      return;
    }

    // ラベル描画とクエリ処理
    renderLabels(config);
    handleQueryIfExists(config);
  };
}

/* ===================================================
   ラベルボタン描画
================================================= */
function renderLabels(config) {
  const container = document.getElementById(config.labelContainerId);
  if (!container) return;

  container.innerHTML = "";
  const labels = Array.from(config._labelSet).sort();

  if (labels.length === 0) {
    container.innerHTML = "<span class='label-placeholder'>データがありません</span>";
    return;
  }

  labels.forEach(label => {
    const a = document.createElement("a");
    a.href = `records/${config.pageType}.html?label=${encodeURIComponent(label)}`;
    a.textContent = label;
    container.appendChild(a);
  });
}

/* ===================================================
   クエリパラメータ処理
   ?label=xxx がある場合は記事リスト表示
================================================= */
function handleQueryIfExists(config) {
  const params = new URLSearchParams(location.search);
  const label = params.get("label");
  if (!label) return;

  const listBox = document.getElementById(config.listBoxId);
  if (listBox) listBox.style.display = "block";

  showLatestPosts(label);
}

/* ===================================================
   ラベル別最新記事5件表示
================================================= */
function showLatestPosts(label) {
  document.getElementById("list-title").textContent = `${label} の最新5件`;
  document.getElementById("more-link").href =
    `${BLOG_URL}/search/label/${encodeURIComponent(label)}`;

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default/-/${encodeURIComponent(label)}` +
    `?alt=json-in-script&callback=handlePosts&max-results=5`;

  document.body.appendChild(script);
}

/* ===================================================
   記事一覧描画
================================================= */
function handlePosts(data) {
  const list = document.querySelector("#latest-list ul");
  if (!list) return;

  list.innerHTML = "";
  const entries = data.feed.entry || [];

  if (entries.length === 0) {
    list.innerHTML = "<li>記事が見つかりません</li>";
    return;
  }

  entries.forEach(entry => {
    const title = entry.title.$t;
    const link = entry.link.find(l => l.rel === "alternate").href;
    const date = new Date(entry.published.$t).toLocaleDateString();

    const li = document.createElement("li");
    li.innerHTML = `<small>${date}</small> <a href="${link}" target="_blank">${title}</a>`;
    list.appendChild(li);
  });
}

/* ===================================================
   パンくずナビゲーション描画
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
