/* =========================================================
   blogfeed.js
   Blogger RSS から最新山行記録を取得・表示する
   ========================================================= */

(function () {
  'use strict';

  /* =====================================================
     Layer 1: Data Layer（取得・正規化）
     ===================================================== */

  const BLOGGER_FEED_URL =
    'https://hiro-san-163.blogspot.com/feeds/posts/default?alt=json&max-results=10';

  async function fetchBloggerEntries() {
    const res = await fetch(BLOGGER_FEED_URL);
    if (!res.ok) throw new Error('Blogger フィード取得失敗');

    const data = await res.json();
    return (data.feed?.entry || []).map(normalizeEntry);
  }

  function normalizeEntry(entry) {
    return {
      title: entry.title?.$t || '',
      content: entry.content?.$t || '',
      published: entry.published?.$t || '',
      updated: entry.updated?.$t || '',
      url: entry.link?.find(l => l.rel === 'alternate')?.href || ''
    };
  }

  /* =====================================================
     Layer 2: Domain Layer（山行記録として解釈）
     ===================================================== */

  function buildRecordModel(entry) {
    const meta = extractMeta(entry.content);

    return {
      title: entry.title,
      date: meta.date || formatDate(entry.published),
      area: meta.area || '',
      genre: meta.genre || '',
      summary: extractImpression(entry.content, 100),
      url: entry.url
    };
  }

  function extractMeta(html) {
    const text = stripHTML(html);

    const date =
      text.match(/実施日[:：]\s*(.+)/)?.[1] || '';

    const area =
      text.match(/山域[:：]\s*(.+)/)?.[1] || '';

    const genre =
      text.match(/ジャンル[:：]\s*(.+)/)?.[1] || '';

    return { date, area, genre };
  }

  function extractImpression(html, maxLength) {
    const text = stripHTML(html);

    const m =
      text.match(/感想[:：]\s*([\s\S]+)/);

    if (!m) return '';

    const body = m[1].trim();
    return body.length > maxLength
      ? body.slice(0, maxLength) + '…'
      : body;
  }

  function stripHTML(html) {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n+/g, '\n')
      .trim();
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d)
      ? ''
      : d.toISOString().slice(0, 10);
  }

  /* =====================================================
     Layer 3: Presentation Layer（描画）
     ===================================================== */

  function renderLatestRecords(records, options) {
    const {
      target,
      max = 5
    } = options;

    const container = document.querySelector(target);
    if (!container) return;

    container.innerHTML = '';

    records.slice(0, max).forEach(r => {
      const card = document.createElement('article');
      card.className = 'record-card';

      card.innerHTML = `
        <div class="record-date">${r.date}</div>
        <h3 class="record-title">
          <a href="${r.url}" target="_blank" rel="noopener">
            ${r.title}
          </a>
        </h3>
        <div class="record-meta">
          ${r.area ? `山域：${r.area}` : ''}
          ${r.genre ? `　ジャンル：${r.genre}` : ''}
        </div>
        ${r.summary
          ? `<p class="record-summary">${r.summary}</p>`
          : ''}
      `;

      container.appendChild(card);
    });
  }

  /* =====================================================
     Public API
     ===================================================== */

  window.renderLatestBlogPosts = async function (options = {}) {
    try {
      const entries = await fetchBloggerEntries();
      const records = entries.map(buildRecordModel);
      renderLatestRecords(records, options);
    } catch (e) {
      console.error(e);
    }
  };

})();
