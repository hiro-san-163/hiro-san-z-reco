/* =========================================================
   blogfeed.js
   Blogspot最新記事表示（登録日、タイトル、詳細情報）
========================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";

console.log("blogfeed.js loaded");

/* ---------- エントリーポイント ---------- */
function renderLatestBlogPosts(options) {
  const {
    target = "#latest-records",
    max = 3
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

  const card = temp.querySelector(".rec-card");
  if (!card) return {};

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

  const img = card.querySelector(".rec-main-photo img");
  const image = img ? img.src : "";

  const summaryEl = card.querySelector(".rec-summary");
  let summary = summaryEl ? summaryEl.innerText.trim() : "";
  summary = summary.substring(0, 100);

  return { date, area, genre, summary, image };
}

/* ---------- JSONP callback ---------- */
window.handleLatestPosts = function(data) {

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
    const linkObj = entry.link.find(l => l.rel === "alternate");
    const link = linkObj ? linkObj.href : "#";
    const published = new Date(entry.published.$t)
      .toLocaleDateString("ja-JP");

    const content = entry.content ? entry.content.$t : "";
    const postInfo = extractPostContent(content);

    const article = document.createElement("article");
    article.className = "record-card";

    article.innerHTML = `
      ${postInfo.image ? `
        <img src="${postInfo.image}" class="record-thumb">
      ` : ""}

      <div class="record-content">

        <div class="record-header">
          <p class="record-meta">${published}</p>
          <h3 class="record-title">
            <a href="${link}" target="_blank" rel="noopener">
              ${title}
            </a>
          </h3>
        </div>

        ${(postInfo.date || postInfo.area || postInfo.genre) ? `
          <div class="record-info">
            ${postInfo.date ? `<span>実施日：${postInfo.date}</span>` : ""}
            ${postInfo.area ? `<span>山域：${postInfo.area}</span>` : ""}
            ${postInfo.genre ? `<span>ジャンル：${postInfo.genre}</span>` : ""}
          </div>
        ` : ""}

        ${postInfo.summary ? `
          <div class="record-summary">
            ${postInfo.summary}…
          </div>
        ` : ""}

      </div>
    `;

    container.appendChild(article);
  });
};
