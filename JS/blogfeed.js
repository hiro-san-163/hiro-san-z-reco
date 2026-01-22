/* ===================================================
   blogfeed.js
   Blogger 最新山行記録表示（安全＋本文解析版）
   対象：
   - index.html
   - records/index.html
=================================================== */

(function () {
  'use strict';

  const BLOG_URL = 'https://hiro-san-163.blogspot.com';
  const MAX_RESULTS = 5;

  /* =========================================
     公開関数
  ========================================= */
  window.renderLatestBlogPosts = function (options = {}) {
    const targetSelector = options.target || '#latest-cards';
    const max = options.max || MAX_RESULTS;

    const container = document.querySelector(targetSelector);
    if (!container) return;

    // 二重実行防止
    if (container.dataset.loaded) return;
    container.dataset.loaded = 'true';

    const callbackName = `handleBlogFeed_${Date.now()}`;

    window[callbackName] = function (data) {
      try {
        renderEntries(container, data.feed?.entry || []);
      } catch (e) {
        console.error(e);
        container.innerHTML = '<p class="error">表示に失敗しました</p>';
      }
      cleanup(callbackName);
    };

    const script = document.createElement('script');
    script.src =
      `${BLOG_URL}/feeds/posts/default` +
      `?alt=json-in-script` +
      `&callback=${callbackName}` +
      `&max-results=${max}`;
    document.body.appendChild(script);
  };

  /* =========================================
     描画処理
  ========================================= */
  function renderEntries(container, entries) {
    container.innerHTML = '';

    if (!entries.length) {
      container.innerHTML =
        '<p class="empty">表示できる山行記録がありません。</p>';
      return;
    }

    entries.forEach(entry => {
      const title = entry.title?.$t || '(無題)';
      const url = entry.link?.find(l => l.rel === 'alternate')?.href || '#';

      const published = entry.published?.$t || '';
      const publishDate = published
        ? new Date(published).toLocaleDateString()
        : '';

      const labels = (entry.category || []).map(c => c.term);

      const area = labels.find(l => l.endsWith('山域')) || '';
      const genre = labels.find(l => l.endsWith('登山')) || labels[0] || '';

      const content = entry.content?.$t || '';
      const summary = extractImpression(content);

      const card = document.createElement('article');
      card.className = 'record-card';
      card.innerHTML = `
        <div class="record-date">${publishDate}</div>
        <h3 class="record-title">
          <a href="${url}" target="_blank" rel="noopener">${title}</a>
        </h3>
        <div class="record-meta">
          ${area ? `山域：${area}` : ''}
          ${genre ? `　ジャンル：${genre}` : ''}
        </div>
        ${summary ? `<p class="record-summary">${summary}</p>` : ''}
      `;
      container.appendChild(card);
    });
  }

  /* =========================================
     感想パート抽出（100文字）
  ========================================= */
  function extractImpression(html) {
    if (!html) return '';

    // HTMLタグ除去
    const text = html
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) return '';

    return text.length > 100
      ? text.slice(0, 100) + '…'
      : text;
  }

  /* =========================================
     クリーンアップ
  ========================================= */
  function cleanup(name) {
    try {
      delete window[name];
    } catch (_) {}
  }
})();
