// Blog/RSS -> JSON を取得してページにレンダリングする簡易モジュール
const BLOG_BASE = 'https://hiro-san-163.blogspot.com';
// CORS回避のため、allorigins.winプロキシを使用
const PROXY_URL = 'https://api.allorigins.win/get?url=';
const BLOG_FEED_JSON = PROXY_URL + encodeURIComponent(BLOG_BASE + '/feeds/posts/default?alt=json');

// 山行記録JSON
const RECORDS_JSON = 'data/records.json';

// キャッシュ用変数
let cachedEntries = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分

// ブログデータを取得（キャッシュ機能付き）
async function fetchBlogJson(blogUrl = BLOG_BASE, forceRefresh = false) {
  try {
    const now = Date.now();
    if (cachedEntries && !forceRefresh && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedEntries;
    }

    const proxyUrl = PROXY_URL + encodeURIComponent(blogUrl + '/feeds/posts/default?alt=json');
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const proxyData = await res.json();
    const data = JSON.parse(proxyData.contents); // プロキシのcontentsをパース
    cachedEntries = data.feed.entry || [];
    cacheTimestamp = now;
    return cachedEntries;
  } catch (e) {
    console.error('ブログフィード取得失敗:', e);
    return [];
  }
}

// 山行記録データを取得（キャッシュ機能付き）
async function fetchRecordsJson(forceRefresh = false) {
  try {
    const now = Date.now();
    if (cachedEntries && !forceRefresh && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedEntries;
    }

    const res = await fetch(RECORDS_JSON);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json();
    cachedEntries = Array.isArray(data) ? data : [];
    cacheTimestamp = now;
    return cachedEntries;
  } catch (e) {
    console.error('山行記録取得失敗:', e);
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

// 山行記録をパース
function parseRecord(record) {
  const title = record.title || '無題';
  const date = record.date ? new Date(record.date).toLocaleDateString('ja-JP') : '';
  const link = record.yamareco_url || '#';
  const area = record.area || '';
  const genre = record.genre || '';
  
  return {
    title,
    date,
    year: record.date ? record.date.slice(0, 4) : '',
    link,
    thumbnail: '', // 山行記録にはサムネイルがない
    genre,
    region: area
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
  try {
    const records = await fetchRecordsJson();
    console.log('取得したレコード数:', records.length);
    const parsed = records.map(parseRecord);
    console.log('パースしたレコード:', parsed.slice(0, 3)); // 最初の3件を表示
    
    const container = document.querySelector(target);
    if (!container) {
      console.warn(`コンテナが見つかりません: ${target}`);
      return;
    }
    
    renderToContainer(container, parsed, max);
  } catch (error) {
    console.error('renderLatestRecords エラー:', error);
  }
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
// ===============================
// Blogger 最新5件（トップページ用）
// ===============================
async function renderLatestBlogPosts({ max = 5, target = '#latest-cards', blogUrl = BLOG_BASE } = {}) {
  try {
    const entries = await fetchBlogJson(blogUrl);
    const parsed = entries.map(parseEntry);

    const container = document.querySelector(target);
    if (!container) {
      console.warn(`コンテナが見つかりません: ${target}`);
      return;
    }

    container.innerHTML = '';
    parsed.slice(0, max).forEach(post => {
      const div = document.createElement('div');
      div.className = 'record-card';

      if (post.thumbnail) {
        const img = document.createElement('img');
        img.src = post.thumbnail;
        img.alt = post.title;
        img.loading = 'lazy';
        div.appendChild(img);
      }

      const a = document.createElement('a');
      a.href = post.link;
      a.textContent = post.title;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const meta = document.createElement('div');
      meta.className = 'record-meta';
      meta.textContent = [post.date, post.region, post.genre]
        .filter(Boolean)
        .join(' ');

      div.appendChild(a);
      div.appendChild(meta);

      container.appendChild(div);
    });

  } catch (e) {
    console.error('Blogger最新記事の表示に失敗:', e);
  }
}

