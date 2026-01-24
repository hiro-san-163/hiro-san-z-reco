/* ===================================================
   blogfeed.js（基準復元＋最小安全調整版）
   - 確実に動いていた仕様のみ
   - title + published のみ表示
================================================= */

const BLOG_URL = "https://hiro-san-163.blogspot.com";

/* ---------- 初期化 ---------- */
function initLatest(containerId, maxResults = 5) {
  window._latestContainerId = containerId;

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default` +
    `?alt=json-in-script` +
    `&callback=handleLatest` +
    `&max-results=${maxResults}`;

  document.body.appendChild(script);
}

/* ---------- JSONP callback ---------- */
function handleLatest(data) {
  const container = document.getElementById(window._latestContainerId);
  if (!container) return;

  // ★ ローディングを消す（唯一の追加）
  const loading = document.getElementById('latest-loading');
  if (loading) loading.style.display = 'none';

  const entries = data.feed.entry || [];
  container.innerHTML = "";

  if (entries.length === 0) {
    container.innerHTML = "<p>表示できる山行記録がありません。</p>";
    return;
  }

  entries.forEach(entry => {
    const title = entry.title.$t;
    const link = entry.link.find(l => l.rel === "alternate").href;
    const date = new Date(entry.published.$t).toLocaleDateString();

    const div = document.createElement("div");
    div.className = "record-card";
    div.innerHTML = `
      <p class="record-date">${date}</p>
      <h3 class="record-title">
        <a href="${link}" target="_blank">${title}</a>
      </h3>
    `;
    container.appendChild(div);
  });
}
