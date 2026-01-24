/* =========================================================
   blogfeed.js
   最小安定版（登録日 / 最新5件）
========================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";

/* ---------- エントリーポイント ---------- */
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

/* ---------- JSONP callback ---------- */
function handleLatestPosts(data) {
  const container = document.getElementById(window.__latestContainerId);
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
