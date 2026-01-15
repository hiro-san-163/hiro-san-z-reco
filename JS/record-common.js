/* =========================================================
   山行記録 共通ロジック
   year / genre / area 共通利用
   ========================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";
const MAX_RESULTS = 150;

/* エントリーポイント */
function initRecordPage(config) {
  if (!config || !config.labelContainerId) {
    console.error("RECORD_CONFIG が不正です");
    return;
  }

  config._labelSet = new Set();
  fetchAllEntries(config, 1);
}

/* ---------------------------------------------------------
   全件走査（JSONP ページング）
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   JSONP コールバック（ページタイプ別に生成）
--------------------------------------------------------- */
function createFeedHandler(pageType) {
  window[`handleFeed_${pageType}`] = function (data) {
    const config = window.RECORD_CONFIG;
    const entries = data.feed.entry || [];

    entries.forEach(entry => {
      if (!entry.category) return;

      entry.category.forEach(cat => {
        const label = cat.term;

        if (config.excludeLabel && config.excludeLabel(label)) return;

        config._labelSet.add(label);
      });
    });

    /* 次ページ判定 */
    if (entries.length === MAX_RESULTS) {
      const nextIndex =
        Number(data.feed.openSearch$startIndex.$t) + MAX_RESULTS;
      fetchAllEntries(config, nextIndex);
      return;
    }

    /* 全件取得完了 */
    renderLabels(config);
    handleQueryIfExists(config);
  };
}

/* ---------------------------------------------------------
   ラベル描画
--------------------------------------------------------- */
function renderLabels(config) {
  const container = document.getElementById(config.labelContainerId);
  container.innerHTML = "";

  const labels = Array.from(config._labelSet).sort();

  if (labels.length === 0) {
    container.innerHTML =
      "<span class='label-placeholder'>データがありません</span>";
    return;
  }

  labels.forEach(label => {
    const a = document.createElement("a");
    a.href = `records/${config.pageType}.html?label=${encodeURIComponent(label)}`;
    a.textContent = label;
    container.appendChild(a);
  });
}

/* ---------------------------------------------------------
   クエリあり時のみ記事表示
--------------------------------------------------------- */
function handleQueryIfExists(config) {
  const params = new URLSearchParams(location.search);
  const label = params.get("label");
  if (!label) return;

  const listBox = document.getElementById(config.listBoxId);
  if (listBox) listBox.style.display = "block";

  showLatestPosts(label);
}

/* ---------------------------------------------------------
   最新5件表示（共通）
--------------------------------------------------------- */
function showLatestPosts(label) {
  document.getElementById("list-title").textContent =
    `${label} の最新5件`;

  document.getElementById("more-link").href =
    `${BLOG_URL}/search/label/${encodeURIComponent(label)}`;

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default/-/${encodeURIComponent(label)}` +
    `?alt=json-in-script&callback=handlePosts&max-results=5`;
  document.body.appendChild(script);
}

function handlePosts(data) {
  const list = document.querySelector("#latest-list ul");
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
    li.innerHTML =
      `<small>${date}</small> <a href="${link}" target="_blank">${title}</a>`;
    list.appendChild(li);
  });
}

/* ---------------------------------------------------------
   初期化用（HTML 側で必ず呼ぶ）
--------------------------------------------------------- */
(function bootstrap() {
  if (!window.RECORD_CONFIG) return;

  createFeedHandler(RECORD_CONFIG.pageType);
})();

