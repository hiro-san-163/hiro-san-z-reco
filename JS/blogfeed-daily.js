// blogfeed-daily.js（JSONP専用）

const DAILY_FEED_URL =
  "https://hiro-san-163-daily.blogspot.com/feeds/posts/default" +
  "?alt=json-in-script" +
  "&max-results=5" +
  "&callback=handleDailyFeed";

function loadDailyBlogFeed(targetId) {
  window._dailyTargetId = targetId;

  const script = document.createElement("script");
  script.src = DAILY_FEED_URL;
  script.onerror = () => {
    console.error("Daily blog feed load error");
  };

  document.body.appendChild(script);
}

function handleDailyFeed(data) {
  const target = document.getElementById(window._dailyTargetId);
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
}

