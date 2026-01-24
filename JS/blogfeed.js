/* ===================================================
   blogfeed.js（実施日 完全対応・安全版）
================================================== */

const BLOG_URL = "https://hiro-san-163.blogspot.com";

/* ---------- 初期化 ---------- */
function renderLatestBlogPosts(containerId, maxResults = 5) {
  if (!containerId) {
    console.error("renderLatestBlogPosts: target が未指定です");
    return;
  }

  window._latestContainerId = containerId;

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default` +
    `?alt=json-in-script` +
    `&callback=handleLatestPosts` +
    `&max-results=${maxResults}`;

  document.body.appendChild(script);
}

/* ---------- JSONP callback ---------- */
function handleLatestPosts(data) {
  const container = document.getElementById(window._latestContainerId);
  const loading = document.getElementById("latest-loading");

  if (loading) loading.style.display = "none";
  if (!container) return;

  const entries = data.feed.entry || [];
  container.innerHTML = "";

  if (entries.length === 0) {
    container.innerHTML = "<p>表示できる山行記録がありません。</p>";
    return;
  }

  entries.forEach(entry => {
    const title = entry.title.$t;
    const link = entry.link.find(l => l.rel === "alternate").href;

    /* ---- 実施日抽出（日帰り／宿泊対応） ---- */
    let hikeDate = "";
    if (entry.content && entry.content.$t) {
      const match = entry.content.$t.match(
        /実施日[:：]\s*([0-9]{4}年[0-9]{2}月[0-9]{2}日(?:～[0-9]{2}月[0-9]{2}日)?)/
      );
      if (match) {
        hikeDate = match[1];
      }
    }

    /* ---- フォールバック：ブログ登録日 ---- */
    if (!hikeDate) {
      hikeDate = new Date(entry.published.$t).toLocaleDateString();
    }

    const article = document.createElement("article");
    article.className = "record-card";

    article.innerHTML = `
      <div class="record-meta">${hikeDate}</div>
      <h3 class="record-title">
        <a href="${link}" target="_blank" rel="noopener">
          ${title}
        </a>
      </h3>
    `;

    container.appendChild(article);
  });
}

