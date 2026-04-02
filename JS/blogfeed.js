/* =========================================================
   blogfeed.js（JSONP安全化版）
========================================================= */

window.BLOG_URL = window.BLOG_URL || "https://hiro-san-163.blogspot.com";

/* ---------- エントリーポイント ---------- */
function renderLatestBlogPosts(options) {
  const { target = "#latest-records", max = 3 } = options || {};

  // ★グローバル依存を減らすため保持（最小変更）
  window.__latestConfig = { target, max };

  // ★動的callback生成
  const callbackName = createLatestHandler();

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default` +
    `?alt=json-in-script` +
    `&max-results=${max}` +
    `&callback=${callbackName}`; // ★変更

  // ★script削除用
  script.dataset.callback = callbackName;

  document.body.appendChild(script);
}

/* ---------- 本文から情報抽出 ---------- */
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

/* =========================================================
   ★追加：動的callback生成
========================================================= */
function createLatestHandler() {

  const callbackName = `latestCallback_${Date.now()}`;

  window[callbackName] = function (data) {

    const config = window.__latestConfig || {};
    const selector = config.target || "#latest-records";

    const container = document.querySelector(selector);
    const loading = document.getElementById("latest-loading");

    try {

      if (loading) loading.remove();
      if (!container) return;

      if (!data || !data.feed || !data.feed.entry) {
        container.innerHTML = "<p>山行記録を取得できませんでした。</p>";
        return;
      }

      container.classList.add("latest");
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