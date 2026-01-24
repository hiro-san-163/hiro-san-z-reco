/* =========================================================
   blogfeed.js
   Blogspot最新記事表示（登録日、タイトル、詳細情報）
========================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";

/* ---------- エントリーポイント ---------- */
function renderLatestBlogPosts(options) {
  const {
    target = "#latest-records",
    max = 5
  } = options || {};

  window.__latestContainerSelector = target;
  window.__latestMaxResults = max;

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default` +
    `?alt=json-in-script` +
    `&max-results=${max}` +
    `&callback=handleLatestPosts`;

  document.body.appendChild(script);
}

/* ---------- 本文から情報抽出 ---------- */
function extractPostContent(htmlContent) {
  const temp = document.createElement("div");
  temp.innerHTML = htmlContent;

  // テキストを取得
  const text = temp.innerText || temp.textContent;

  // パターンマッチで情報を抽出
  const patterns = {
    date: /実施日[：:]\s*(\d{4}年\d{1,2}月\d{1,2}日|[\d\-\/年月日]+)/,
    area: /エリア[：:]?\s*([^、\n]+?)(?:、|$|\n)/,
    genre: /ジャンル[：:]\s*([^、\n]+?)(?:、|$|\n)/,
    impression: /感想[：:]\s*([\s\S]{0,100}?)(?:\n|$|。(?!\S))/
  };

  const result = {
    date: "",
    area: "",
    genre: "",
    impression: ""
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      result[key] = match[1].trim().substring(0, key === "impression" ? 100 : 50);
    }
  }

  return result;
}

/* ---------- JSONP callback ---------- */
function handleLatestPosts(data) {
  const selector = window.__latestContainerSelector || "#latest-records";
  const container = document.querySelector(selector);
  const loading = document.getElementById("latest-loading");

  if (loading) loading.remove();
  if (!container) return;

  if (!data || !data.feed || !data.feed.entry) {
    container.innerHTML = "<p>山行記録を取得できませんでした。</p>";
    return;
  }

  const entries = data.feed.entry;
  container.innerHTML = "";

  entries.forEach(entry => {
    const title = entry.title.$t;
    const link = entry.link.find(l => l.rel === "alternate").href;
    const published = new Date(entry.published.$t).toLocaleDateString("ja-JP");

    // 本文から詳細情報を抽出
    const content = entry.summary ? entry.summary.$t : "";
    const postInfo = extractPostContent(content);

    const article = document.createElement("article");
    article.className = "record-card";

    let detailsHtml = "";
    if (postInfo.date) detailsHtml += `<div class="record-detail"><strong>実施日:</strong> ${postInfo.date}</div>`;
    if (postInfo.area) detailsHtml += `<div class="record-detail"><strong>エリア:</strong> ${postInfo.area}</div>`;
    if (postInfo.genre) detailsHtml += `<div class="record-detail"><strong>ジャンル:</strong> ${postInfo.genre}</div>`;
    if (postInfo.impression) detailsHtml += `<div class="record-detail"><strong>感想:</strong> ${postInfo.impression}…</div>`;

    article.innerHTML = `
      <div class="record-meta">${published}</div>
      <h3 class="record-title">
        <a href="${link}" target="_blank" rel="noopener">
          ${title}
        </a>
      </h3>
      ${detailsHtml}
    `;

    container.appendChild(article);
  });
}
