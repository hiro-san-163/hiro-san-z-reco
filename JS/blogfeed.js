// ========================================
// 共通設定
// ========================================
const BLOG_BASE = 'https://hiro-san-163.blogspot.com';
const PROXY_URL = 'https://api.allorigins.win/get?url=';
const BLOG_FEED_URL =
  PROXY_URL + encodeURIComponent(BLOG_BASE + '/feeds/posts/default?alt=json');

const CACHE_DURATION = 5 * 60 * 1000;

let blogCache = { data: null, timestamp: 0 };

// ========================================
// フィード取得（共通）
// ========================================
async function fetchBlogJson() {
  const now = Date.now();
  if (blogCache.data && now - blogCache.timestamp < CACHE_DURATION) {
    return blogCache.data;
  }

  const res = await fetch(BLOG_FEED_URL);
  const proxyData = await res.json();
  const data = JSON.parse(proxyData.contents);

  blogCache.data = data.feed?.entry || [];
  blogCache.timestamp = now;
  return blogCache.data;
}

// ========================================
// トップページ用解析
// ========================================
function parseEntryForTop(entry) {
  const link =
    entry.link?.find(l => l.rel === 'alternate')?.href || '#';

  const date = entry.published?.$t
    ? new Date(entry.published.$t).toLocaleDateString('ja-JP')
    : '';

  let title = entry.title?.$t || '';
  let area = '';
  let genre = '';
  let summary = '';

  if (entry.content?.$t) {
    const doc = new DOMParser().parseFromString(entry.content.$t, 'text/html');

    title = doc.querySelector('.mountain-title')?.textContent.trim() || title;
    area  = doc.querySelector('.area')?.textContent.trim() || '';
    genre = doc.querySelector('.genre')?.textContent.trim() || '';

    const text = doc.body.textContent.replace(/\s+/g, ' ').trim();
    summary = text.slice(0, 100) + (text.length > 100 ? '…' : '');
  }

  return { date, area, genre, title, summary, link };
}

// ========================================
// 検索ページ用解析（旧仕様互換）
// ========================================
function parseEntryForSearch(entry) {
  const link =
    entry.link?.find(l => l.rel === 'alternate')?.href || '#';

  const date = entry.published?.$t
    ? new Date(entry.published.$t).toLocaleDateString('ja-JP')
    : '';

  let title = entry.title?.$t || '';
  let area = '';
  let genre = '';
  let body = '';

  if (entry.content?.$t) {
    const doc = new DOMParser().parseFromString(entry.content.$t, 'text/html');

    title = doc.querySelector('.mountain-title')?.textContent.trim() || title;
    area  = doc.querySelector('.area')?.textContent.trim() || '';
    genre = doc.querySelector('.genre')?.textContent.trim() || '';
    body  = doc.body.innerText.trim();
  }

  return { date, area, genre, title, body, link };
}
