/* =========================================================
   blogfeed.js
   Blogspot最新記事表示（登録日、タイトル、詳細情報）
========================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";

console.log("blogfeed.js loaded");

/* ---------- エントリーポイント ---------- */
function renderLatestBlogPosts(options) {
  console.log("renderLatestBlogPosts called with options:", options);
  
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

  console.log("Loading blog feed from:", script.src);
  document.body.appendChild(script);
}

/* ---------- 本文から情報抽出 ---------- */
function extractPostContent(htmlContent) {
  const temp = document.createElement("div");
  temp.innerHTML = htmlContent;

  // テキストを取得
  const text = temp.innerText || temp.textContent;

  // デバッグ用ログ
  console.log("抽出する本文:", text);

  // パターンマッチで情報を抽出
  const patterns = {
    date: /実施日[：:]\s*([^\n、]+)/,
    area: /エリア[：:]\s*([^\n、]+)/,
    genre: /ジャンル[：:]\s*([^\n、]+)/,
    impression: /感想[：:]\s*([^\n。]+)/
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
      let value = match[1].trim();
      // 最大文字数を制限
      if (key === "impression") {
        value = value.substring(0, 100);
      } else {
        value = value.substring(0, 50);
      }
      result[key] = value;
      console.log(`${key}: ${value}`);
    }
  }

  return result;
}

/* ---------- JSONP callback ---------- */
window.handleLatestPosts = function(data) {
  console.log("handleLatestPosts called with data:", data);
  
  const selector = window.__latestContainerSelector || "#latest-records";
  const container = document.querySelector(selector);
  const loading = document.getElementById("latest-loading");

  console.log("Container found:", container);

  if (loading) loading.remove();
  if (!container) {
    console.error("Container not found for selector:", selector);
    return;
  }

  if (!data || !data.feed || !data.feed.entry) {
    container.innerHTML = "<p>山行記録を取得できませんでした。</p>";
    console.error("No entries found in feed data");
    return;
  }

  const entries = data.feed.entry;
  console.log("Found entries:", entries.length);
  container.innerHTML = "";

  entries.forEach((entry, index) => {
    console.log(`Processing entry ${index}:`, entry);
    
    const title = entry.title.$t;
    const linkObj = entry.link.find(l => l.rel === "alternate");
    const link = linkObj ? linkObj.href : "#";
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
};
