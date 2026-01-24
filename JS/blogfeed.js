/* =========================================================
   blogfeed.js
   Blogger JSONP 専用（最小安定版）
   - index.html / records/index.html 共通
   - published（ブログ登録日）を表示
========================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";

/* ---- エントリーポイント ---- */
function renderLatestBlogPosts(containerId, maxResults = 5) {
  // containerId をグローバルに保持
  window.__latestContainerId = containerId;

  const script = document.createElement("script");
  script.src =
    BLOG_URL +
    "/feeds/posts/default" +
    "?alt=json-in-script" +
    "&max-results=" + maxResults +
    "&callback=handleLatestPosts";

  document.body.appendChild(script);
}

/* ---- JSONP callback（必ず window に存在） ---- */
function handleLatestPosts(data) {
  const container = document.getElementById(window.__latestContainerId);
  const loading = document.getElementById("latest-loading");

  if (loading) loading.remove();
  if (!container) return;

  const entries = data.feed.entry || [];

  if (entries.length === 0) {
    container.innerHTML = "<p>表示できる山行記録がありません。</p>";
    return;
  }

  container.innerHTML = "";

  entries.forEach(entry => {
    const title = entry.title.$t;
    const link = entry.link.find(l => l.rel === "alternate").href;
    const published = new Date(entry.published.$t).toLocaleDateString();

    const article = document.createElement("article");
    article.className = "record-card";

    article.innerHTML = `
      <div class="record-meta">${published}</div>
      <h3 class="record-title">
        <a href="${link}" target="_blank" rel="noopener">
          ${title}
        </a>
      </h3>
    `;

    container.appendChild(article);
  });
}
