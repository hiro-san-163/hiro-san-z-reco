/* =========================================================
   blogfeed.js  完成・安全版
   ・Blogger JSONP 直接取得
   ・項目名は一切変更しない
   ・index.html / records/index.html 共通利用
========================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";

/* =========================================================
   外部呼び出し用 API
   renderLatestBlogPosts({ target: "#id", max: 5 })
========================================================= */
function renderLatestBlogPosts(options) {
  if (!options || !options.target) {
    console.error("renderLatestBlogPosts: target が未指定です");
    return;
  }

  window.__LATEST_TARGET_ID = options.target.replace("#", "");
  window.__LATEST_MAX = options.max || 5;

  const script = document.createElement("script");
  script.src =
    BLOG_URL +
    "/feeds/posts/default" +
    "?alt=json-in-script" +
    "&callback=__handleLatestPosts" +
    "&max-results=" +
    window.__LATEST_MAX;

  document.body.appendChild(script);
}

/* =========================================================
   JSONP callback
========================================================= */
function __handleLatestPosts(data) {
  const container = document.getElementById(window.__LATEST_TARGET_ID);
  const loading = document.getElementById("latest-loading");

  if (loading) loading.style.display = "none";
  if (!container) return;

  container.innerHTML = "";

  const entries = data.feed.entry || [];
  if (entries.length === 0) {
    container.innerHTML = "<p>表示できる山行記録がありません。</p>";
    return;
  }

  entries.forEach(entry => {
    const title = entry.title.$t;

    const linkObj = entry.link.find(l => l.rel === "alternate");
    const link = linkObj ? linkObj.href : "#";

    const published = new Date(entry.published.$t).toLocaleDateString();

    /* --- ラベル（山域・ジャンルなど） --- */
    let labels = "";
    if (entry.category && entry.category.length) {
      labels = entry.category.map(c => c.term).join(" / ");
    }

    /* --- summary（冒頭100字） --- */
    let summary = "";
    if (entry.summary && entry.summary.$t) {
      summary = entry.summary.$t
        .replace(/<[^>]+>/g, "")
        .slice(0, 100);
    }

    const labelText = labels ? "｜" + labels : "";

    const article = document.createElement("article");
    article.className = "record-card";

    article.innerHTML = `
      <div class="record-meta">
        ${published}${labelText}
      </div>
      <h3 class="record-title">
        <a href="${link}" target="_blank" rel="noopener">
          ${title}
        </a>
      </h3>
      ${summary ? `<p class="record-summary">${summary}</p>` : ""}
    `;

    container.appendChild(article);
  });
}

