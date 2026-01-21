// ========================================
// 設定
// ========================================
const BLOG_BASE = 'https://hiro-san-163.blogspot.com';
const PROXY_URL = 'https://api.allorigins.win/get?url=';
const BLOG_FEED_URL =
  PROXY_URL + encodeURIComponent(BLOG_BASE + '/feeds/posts/default?alt=json');

const RECORDS_JSON = 'data/records.json';
const CACHE_DURATION = 5 * 60 * 1000; // 5分

// ========================================
// キャッシュ
// ========================================
let blogCache = { data: null, timestamp: 0 };
let recordsCache = { data: null, timestamp: 0 };

// ========================================
// Blogger フィード取得
// ========================================
async function fetchBlogJson(forceRefresh = false) {
  const now = Date.now();
  if (
    blogCache.data &&
    !forceRefresh &&
    now - blogCache.timestamp < CACHE_DURATION
  ) {
    return blogCache.data;
  }

  try {
    const res = await fetch(BLOG_FEED_URL);
    if (!res.ok) throw new Error(res.status);

    const proxyData = await res.json();
    const data = JSON.parse(proxyData.contents);

    blogCache.data = data.feed?.entry || [];
    blogCache.timestamp = now;
    return blogCache.data;
  } catch (e) {
    console.error('ブログフィード取得失敗:', e);
    return [];
  }
}

// ========================================
// Blogger エントリ解析（テキスト専用）
// ========================================
function parseBlogEntry(entry) {
  let title = entry.title?.$t || '無題';
  let date = entry.published?.$t
    ? new Date(entry.published.$t).toLocaleDateString('ja-JP')
    : '';

  const link =
    entry.link?.find(l => l.rel === 'alternate')?.href || '#';

  let region = '';
  let genre = '';

  if (entry.content?.$t) {
    const doc = new DOMParser().parseFromString(
      entry.content.$t,
      'text/html'
    );

    const titleEl = doc.querySelector('.mountain-title');
    if (titleEl) title = titleEl.textContent.trim();

    const areaEl = doc.querySelector('.area');
    if (areaEl) region = areaEl.textContent.trim();

    const genreEl = doc.querySelector('.genre');
    if (genreEl) genre = genreEl.textContent.trim();
  }

  return { title, date, region, genre, link };
}

// ========================================
// 最新5件（トップ／records 共通）
// ========================================
async function renderLatestBlogPosts({
  max = 5,
  target = '#latest-cards'
} = {}) {
  const container = document.querySelector(target);
  if (!container) return;

  /* ★ ここで必ず読み込み中表示を消す */
  container.innerHTML = '';

  try {
    const entries = await fetchBlogJson();
    const parsed = entries.map(parseBlogEntry).slice(0, max);

    if (parsed.length === 0) {
      container.innerHTML =
        '<p class="loading-note">表示できる山行記録がありません。</p>';
      return;
    }

    parsed.forEach(post => {
      const item = document.createElement('div');
      item.className = 'latest-text-item';

      const meta = document.createElement('div');
      meta.className = 'latest-meta';
      meta.textContent = [post.date, post.region, post.genre]
        .filter(Boolean)
        .join('　');

      const a = document.createElement('a');
      a.href = post.link;
      a.textContent = post.title;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'latest-title';

      item.appendChild(meta);
      item.appendChild(a);
      container.appendChild(item);
    });
  } catch (e) {
    console.error('最新記事表示失敗:', e);
    container.innerHTML =
      '<p class="loading-note">最新の山行記録を取得できませんでした。</p>';
  }
}

// ========================================
// 以下：既存の絞り込み機能（変更なし）
// ========================================
async function renderRecordsByFilter(filterFn, containerId) {
  const entries = await fetchBlogJson();
  const parsed = entries.map(parseBlogEntry).filter(filterFn);

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  parsed.forEach(post => {
    const div = document.createElement('div');
    const a = document.createElement('a');
    a.href = post.link;
    a.textContent = post.title;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    div.appendChild(a);
    container.appendChild(div);
  });
}

async function renderRecordsByYear(year) {
  await renderRecordsByFilter(p => p.date.startsWith(year), 'year-results');
}

async function renderRecordsByArea(area) {
  await renderRecordsByFilter(p => p.region === area, 'area-results');
}

async function renderRecordsByGenre(genre) {
  await renderRecordsByFilter(p => p.genre === genre, 'genre-results');
}
