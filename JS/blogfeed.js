/* ===================================
   blogfeed.js
   Blogger 最新山行記録取得
   =================================== */

async function fetchBlogJson(options) {
  return renderLatestBlogPosts(options);
}

async function renderLatestBlogPosts({
  target,
  max = 5
}) {
  const container = document.querySelector(target);
  if (!container) return;

  try {
    const feedUrl =
      'https://www.blogger.com/feeds/YOUR_BLOG_ID/posts/default?alt=json';

    const resp = await fetch(feedUrl);
    if (!resp.ok) throw new Error('fetch failed');

    const data = await resp.json();
    const entries = data.feed.entry || [];

    container.innerHTML = '';

    entries.slice(0, max).forEach(entry => {
      const title = entry.title.$t;
      const url = entry.link.find(l => l.rel === 'alternate').href;
      const published = entry.published.$t.slice(0, 10);

      const content =
        entry.content?.$t || entry.summary?.$t || '';

      const summary = content
        .replace(/<[^>]+>/g, '')
        .slice(0, 100) +
        (content.length > 100 ? '…' : '');

      const card = document.createElement('div');
      card.className = 'record-card';
      card.innerHTML = `
        <div class="record-date">${published}</div>
        <h3 class="record-title">
          <a href="${url}" target="_blank" rel="noopener">${title}</a>
        </h3>
        <p class="record-summary">${summary}</p>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<div class="empty">山行記録を取得できませんでした</div>';
  }
}

