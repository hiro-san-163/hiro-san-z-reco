/**
 * ひびのこと（Blogger）最新記事取得（JSONP安全版）
 */

function loadDailyBlogFeed(targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    console.error("Daily blog target not found:", targetId);
    return;
  }

  // ★設定保持
  window.__dailyConfig = { targetId };

  // ★動的callback生成
  const callbackName = createDailyHandler();

  const script = document.createElement("script");
  script.src =
    "https://hiro-san-163-daily.blogspot.com/feeds/posts/default" +
    "?alt=json-in-script" +
    "&max-results=5" +
    "&callback=" + callbackName;

  // ★script削除用
  script.dataset.callback = callbackName;

  script.onerror = function () {
    target.innerHTML = "<p>ブログ記事を読み込めませんでした。</p>";
  };

  document.body.appendChild(script);
}

/**
 * ★動的callback生成
 */
function createDailyHandler() {

  const callbackName = `dailyCallback_${Date.now()}`;

  window[callbackName] = function (data) {

    const config = window.__dailyConfig || {};
    const target = document.getElementById(config.targetId);

    try {

      if (!target) return;

      if (!data.feed || !data.feed.entry) {
        target.innerHTML = "<p>記事が見つかりません。</p>";
        return;
      }

      const entries = data.feed.entry;
      let html = "";

      entries.forEach(entry => {
        const title = entry.title.$t;
        const link = entry.link.find(l => l.rel === "alternate").href;
        const published = entry.published.$t.substring(0, 10);

        html += `
          <article class="blog-card">
            <h3 class="blog-title">
              <a href="${link}" target="_blank" rel="noopener">
                ${title}
              </a>
            </h3>
            <p class="blog-date">${published}</p>
          </article>
        `;
      });

      target.innerHTML = html;

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
