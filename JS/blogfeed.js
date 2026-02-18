/* =========================================================
   blogfeed.js
   最新山行記録表示（指定レイアウト完全対応版）
========================================================= */

window.BLOG_URL = window.BLOG_URL || "https://hiro-san-163.blogspot.com";

/* ---------- エントリーポイント ---------- */
function renderLatestBlogPosts(options) {
  const { target = "#latest-records", max = 3 } = options || {};

  window.__latestContainerSelector = target;
  window.__latestMaxResults = max;

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default?alt=json-in-script&max-results=${max}&callback=handleLatestPosts`;

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

  container.innerHTML = "";

  data.feed.entry.forEach(entry => {

    const title = entry.title.$t;
    const linkObj = entry.link.find(l => l.rel === "alternate");
    const link = linkObj ? linkObj.href : "#";

    const content = entry.content ? entry.content.$t : "";
    const postInfo = extractPostContent(content);

    const article = document.createElement("article");
    article.className = "record-card";

    article.innerHTML = `

      <div class="record-top">

        ${postInfo.image ? `
          <div class="record-image">
            <img src="${postInfo.image}" alt="${title}">
          </div>
        ` : ""}

        <div class="record-text">
          <h3 class="record-title">
            <a href="${link}" target="_blank" rel="noopener">
              ${title}
            </a>
          </h3>

          <div class="record-info">
            ${postInfo.date ? `実施日：${postInfo.date}` : ""}
            ${postInfo.area ? ` ｜ 山域：${postInfo.area}` : ""}
            ${postInfo.genre ? ` ｜ ジャンル：${postInfo.genre}` : ""}
          </div>
        </div>

      </div>

      ${postInfo.summary ? `
        <div class="record-summary">
          ${postInfo.summary}…
        </div>
      ` : ""}

    `;

    container.appendChild(article);
  });
};
