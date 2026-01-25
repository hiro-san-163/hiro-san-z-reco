/**
 * ひびのこと（Blogger）最新記事取得（JSONP方式）
 * GitHub Pages / CORS回避対応
 */

function loadDailyBlogFeed(targetId) {
  const target = document.getElementById(targetId);
  if (!target) {
    console.error("Daily blog target not found:", targetId);
    return;
  }

  // JSONP用コールバック名
  const callbackName = "handleDailyBlogFeed";

  // Blogger JSONP フィードURL
  const feedUrl =
    "https://hiro-san-163-daily.blogspot.com/feeds/posts/default" +
    "?alt=json-in-script" +
    "&max-results=5" +
    "&callback=" + callbackName;

  // 既存scriptがあれば削除（再読込対策）
  const oldScript = document.getElementById("daily-blog-feed-script");
  if (oldScript) oldScript.remove();

  // scriptタグ生成
  const script = document.createElement("script");
  script.src = feedUrl;
  script.id = "daily-blog-feed-script";
  script.onerror = function () {
    target.innerHTML = "<p>ブログ記事を読み込めませんでした。</p>";
  };

  document.body.appendChild(script);
}

/**
 * JSONP コールバック
 */
function handleDailyBlogFeed(data) {
  const target = document.getElementById("daily-cards");
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
}

