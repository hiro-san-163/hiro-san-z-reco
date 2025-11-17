// Blog/RSS -> JSON を取得してページにレンダリングする簡易モジュール
const BLOG_BASE = 'https://hiro-san-163.blogspot.com';
const BLOG_FEED_JSON = BLOG_BASE + '/feeds/posts/default?alt=json';

// キャッシュ用変数
let cachedEntries = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分

// ブログデータを取得（キャッシュ機能付き）
async function fetchBlogJson(forceRefresh = false) {
  try {
    const now = Date.now();
    if (cachedEntries && !forceRefresh && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedEntries;
    }

    const res = await fetch(BLOG_FEED_JSON);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json();
    cachedEntries = data.feed.entry || [];
    cacheTimestamp = now;
    return cachedEntries;
  } catch (e) {
    console.error('ブログフィード取得失敗:', e);
    return [];
  }
}

// 単一のエントリをパース
function parseEntry(entry) {
  const title = entry.title?.$t || '無題';
  const published = entry.published?.$t ? new Date(entry.published.$t).toLocaleDateString('ja-JP') : '';
  
  const links = entry.link || [];
  const postLinkObj = links.find(l => l.rel === 'alternate');
  const link = postLinkObj?.href || '#';
  
  let thumbnail = '';
  if (entry.media$thumbnail) {
    thumbnail = entry.media$thumbnail.url.replace(/s\d+/, 's400');
  } else if (entry.content?.['$t']) {
    const match = entry.content.$t.match(/<img[^>]+src=["']([^"']+)["']/i);
    thumbnail = match?.[1] || '';
  }
  
  const labels = entry.category?.map(c => c.term) || [];
  const genreMatch = labels.find(l => /(沢登り|ハイキング|縦走|雪山|街道|トレーニング)/i.test(l));
  const regionMatch = labels.find(l => /(近畿|関東|中部|北海道|東北|中国|四国|九州)/i.test(l));
  
  return {
    title,
    date: published,
    year: published.slice(0, 4),
    link,
    thumbnail,
    genre: genreMatch || '',
    region: regionMatch || ''
  };
}

// DOM要素を作成
function createRecordElement(record) {
  const div = document.createElement('div');
  div.className = 'record-card';
  
  const a = document.createElement('a');
  a.href = record.link;
  a.textContent = record.title;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  
  const meta = document.createElement('div');
  meta.className = 'record-meta';
  meta.textContent = [record.date, record.region, record.genre].filter(Boolean).join(' ');
  
  div.appendChild(a);
  div.appendChild(meta);
  return div;
}

// コンテナにレコードをレンダリング（汎用関数）
function renderToContainer(container, records, max = 20) {
  if (!container) return;
  container.innerHTML = '';
  records.slice(0, max).forEach(record => {
    container.appendChild(createRecordElement(record));
  });
}

// 最新レコードをレンダリング
async function renderLatestRecords({ max = 5, target = '#records-list' } = {}) {
  const entries = await fetchBlogJson();
  const parsed = entries.map(parseEntry);
  
  const container = document.querySelector(target);
  if (!container) {
    console.warn(`コンテナが見つかりません: ${target}`);
    return;
  }
  
  renderToContainer(container, parsed, max);
}

// フィルター関数を統合
async function renderRecordsByFilter(filteredCallback, containerId) {
  const entries = await fetchBlogJson();
  const parsed = entries.map(parseEntry);
  const filtered = parsed.filter(filteredCallback);
  
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`コンテナが見つかりません: ${containerId}`);
    return;
  }
  
  renderToContainer(container, filtered);
}

// 年で絞り込み
async function renderRecordsByYear(year) {
  await renderRecordsByFilter(e => e.year === String(year), 'year-results');
}

// 地域で絞り込み
async function renderRecordsByArea(area) {
  await renderRecordsByFilter(e => e.region === area, 'area-results');
}

// ジャンルで絞り込み
async function renderRecordsByGenre(genre) {
  await renderRecordsByFilter(e => e.genre === genre, 'genre-results');
}
