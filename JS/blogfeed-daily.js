// 日常ブログ用 Blogger Feed 読み込み

const DAILY_FEED_URL =
  "https://hiro-san-163-daily.blogspot.com/feeds/posts/default?alt=json&max-results=5";

function loadDailyBlogFeed(targetId) {
  fetch(DAILY_FEED_URL)
    .then(res => res.json())
    .then(data => {
      const target = document.getElementById(targetId);
      if (!target) return;

      const entries = data.feed.entry || [];
      let html = "<ul class='blog-list'>";

      entries.forEach(entry => {
        const title = entry.title.$t;
        const link = entry.link.find(l => l.rel === "alternate").href;
        const published = entry.published.$t.substring(0, 10);

        html += `
          <li>
            <span class="blog-date">${published}</span>
            <a href="${link}" target="_blank" rel="noopener">
              ${title}
            </a>
          </li>
        `;
      });

      html += "</ul>";
      target.innerHTML = html;
    })
    .catch(err => {
      console.error("Daily blog feed error:", err);
    });
}
