/* =========================================================
   blogfeed.js（最小安定版）
   - Blogger JSONP 専用
   - 登録日（published）を表示
   - index.html / records/index.html 共通
========================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";

/* ---- JSONP callback（必ず window に公開） ---- */
window.handleLatestPosts = function (data) {
  const containerId = window.__latestContainerId;
  const container = document.getElementById(containerId);
  const loading = document.getElementById("latest-loading");

  if (loading) loading.remove();
  if (!container) return;

  if (!data || !data.feed || !data.feed.entry) {
    container.innerHTML = "<p>表示できる山行記録がありません。</p>";
    return;
  }

  const entries = data.feed.entry;
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
};

/* ---- エントリーポイント ---- */
function renderLatestBlogPosts(containerId, maxResults = 5) {
  window.__latestContainerId = containerId;

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default` +
    `?alt=json-in-script` +
    `&max-results=${maxResults}` +
    `&callback=handleLatestPosts`;

  document.body.appendChild(script);
}
