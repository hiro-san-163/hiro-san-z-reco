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

  const card = temp.querySelector(".rec-card");
  if (!card) return {};

  // --- 実施日・山域・ジャンル ---
  const info = card.querySelector(".rec-info");
  let date = "", area = "", genre = "";

  if (info) {
    const ps = info.querySelectorAll("p");
    ps.forEach(p => {
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

  // --- 代表写真 ---
  const img = card.querySelector(".rec-main-photo img");
  const image = img ? img.src : "";

  // --- summary ---
  const summaryEl = card.querySelector(".rec-summary");
  let summary = summaryEl ? summaryEl.innerText.trim() : "";
  summary = summary.substring(0, 100);

  return {
    date,
    area,
    genre,
    summary,
    image
  };
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
  ${postInfo.image ? `
    <img src="${postInfo.image}" class="record-thumb">
  ` : ""}

  <div class="record-meta">${published}</div>

  <h3 class="record-title">
    <a href="${link}" target="_blank" rel="noopener">
      ${title}
    </a>
  </h3>

  ${postInfo.date ? `<div class="record-detail">実施日：${postInfo.date}</div>` : ""}
  ${postInfo.area ? `<div class="record-detail">山域：${postInfo.area}</div>` : ""}
  ${postInfo.genre ? `<div class="record-detail">ジャンル：${postInfo.genre}</div>` : ""}
  ${postInfo.summary ? `<div class="record-summary">${postInfo.summary}…</div>` : ""}
`;

  });
};
