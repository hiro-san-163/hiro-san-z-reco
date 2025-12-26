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
  let title = entry.title?.$t || '無題';
  const published = entry.published?.$t ? new Date(entry.published.$t).toLocaleDateString('ja-JP') : '';
  
  const links = entry.link || [];
  const postLinkObj = links.find(l => l.rel === 'alternate');
  const link = postLinkObj?.href || '#';
  
  let thumbnail = '';
  let date = published;
  let region = '';
  let genre = '';
  let summary = '';
  
  if (entry.content?.['$t']) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(entry.content.$t, 'text/html');
    
    // タイトル
    const titleEl = doc.querySelector('.mountain-title');
    if (titleEl) title = titleEl.textContent.trim();
    
    // 実施日
    const dateEl = doc.querySelector('.date');
    if (dateEl) date = dateEl.textContent.trim();
    
    // 山域
    const areaEl = doc.querySelector('.area');
    if (areaEl) region = areaEl.textContent.trim();
    
    // ジャンル
    const genreEl = doc.querySelector('.genre');
    if (genreEl) genre = genreEl.textContent.trim();
    
    // 山行概要
    const summaryEl = doc.querySelector('.mountain-summary p');
    if (summaryEl) {
      const fullSummary = summaryEl.textContent.trim();
      summary = fullSummary.substring(0, 100) + (fullSummary.length > 100 ? '...' : '');
    }
    
    // 代表写真
    const imgEl = doc.querySelector('.main-photo img');
    if (imgEl) thumbnail = imgEl.src;
    
    console.log('Extracted:', { title, date, region, genre, summary, thumbnail }); // デバッグ用
  }
  
  return {
    title,
    date,
    year: date.slice(0, 4),
    link,
    thumbnail,
    genre,
    region,
    summary
  };
}

// 山行記録をパース
function parseRecord(record) {
  const title = record.title || '無題';
  const date = record.date ? new Date(record.date).toLocaleDateString('ja-JP') : '';
  const link = record.yamareco_url || '#';
  const area = record.area || '';
  const genre = record.genre || '';
  const summary = record.summary || '';
  const recordId = record.record_id;
  
  // ヤマレコの画像URLを推測
  const thumbnail = recordId ? `https://www.yamareco.com/modules/yamareco/photo/${recordId}/1.jpg` : '';
  
  return {
    title,
    date,
    year: record.date ? record.date.slice(0, 4) : '',
    link,
    thumbnail,
    genre,
    region: area,
    summary
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
    
    // 最新5件を取得
    const latestRecords = parsed.slice(0, max);
    
    const container = document.querySelector(target);
    if (!container) {
      console.warn(`コンテナが見つかりません: ${target}`);
      return;
    }
    
    container.innerHTML = '';
    
    latestRecords.forEach((record, index) => {
      if (index === 0) {
        // 最新1件: カード形式
        const div = document.createElement('div');
        div.className = 'record-card-featured';
        
        // 写真
        if (record.thumbnail) {
          const img = document.createElement('img');
          img.src = record.thumbnail;
          img.alt = record.title;
          img.loading = 'lazy';
          img.className = 'record-thumbnail';
          img.onerror = () => img.style.display = 'none';
          div.appendChild(img);
        }
        
        // 右側のコンテンツ
        const contentDiv = document.createElement('div');
        contentDiv.className = 'record-content';
        
        // タイトル
        const titleDiv = document.createElement('div');
        titleDiv.className = 'record-title';
        const a = document.createElement('a');
        a.href = record.link;
        a.textContent = record.title;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        titleDiv.appendChild(a);
        contentDiv.appendChild(titleDiv);
        
        // 実施日、山域、ジャンル
        const metaDiv = document.createElement('div');
        metaDiv.className = 'record-meta';
        metaDiv.innerHTML = `
          <span class="record-date">${record.date}</span>
          <span class="record-area">${record.region}</span>
          <span class="record-genre">${record.genre}</span>
        `;
        contentDiv.appendChild(metaDiv);
        
        // 感想 (100字程度)
        if (record.summary && record.summary.trim()) {
          const summaryDiv = document.createElement('div');
          summaryDiv.className = 'record-summary';
          const truncatedSummary = record.summary.length > 100 ? record.summary.substring(0, 100) + '...' : record.summary;
          summaryDiv.textContent = truncatedSummary;
          contentDiv.appendChild(summaryDiv);
        }
        
        div.appendChild(contentDiv);
        container.appendChild(div);
      } else {
        // 残り4件: リスト形式
        const div = document.createElement('div');
        div.className = 'record-list-item';
        
        const a = document.createElement('a');
        a.href = record.link;
        a.textContent = record.title;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        div.appendChild(a);
        
        const meta = document.createElement('div');
        meta.className = 'record-meta';
        meta.innerHTML = `
          <span class="record-date">${record.date}</span>
          <span class="record-area">${record.region}</span>
          <span class="record-genre">${record.genre}</span>
        `;
        div.appendChild(meta);
        
        container.appendChild(div);
      }
    });
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
    console.log('Parsed entries:', parsed); // デバッグ用

    const container = document.querySelector(target);
    if (!container) {
      console.warn(`コンテナが見つかりません: ${target}`);
      return;
    }

    container.innerHTML = '';
    parsed.slice(0, max).forEach((post, index) => {
      const div = document.createElement('div');
      if (index === 0) {
        // 最新の1件はカード形式
        div.className = 'record-card';

        if (post.thumbnail) {
          const img = document.createElement('img');
          img.src = post.thumbnail;
          img.alt = post.title;
          img.loading = 'lazy';
          div.appendChild(img);
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'card-content';

        const a = document.createElement('a');
        a.href = post.link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = post.title;
        titleSpan.className = 'post-title';
        a.appendChild(titleSpan);

        contentDiv.appendChild(a);

        const meta = document.createElement('div');
        meta.className = 'record-meta';
        meta.textContent = [post.date, post.region, post.genre]
          .filter(Boolean)
          .join(' ');

        contentDiv.appendChild(meta);

        if (post.summary) {
          const summaryDiv = document.createElement('div');
          summaryDiv.className = 'record-summary';
          summaryDiv.textContent = post.summary;
          contentDiv.appendChild(summaryDiv);
        }

        div.appendChild(contentDiv);
      } else {
        // 残りはリスト形式
        div.className = 'record-list';

        const a = document.createElement('a');
        a.href = post.link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = post.title;
        titleSpan.className = 'post-title';
        a.appendChild(titleSpan);

        div.appendChild(a);

        const meta = document.createElement('div');
        meta.className = 'record-meta';
        meta.textContent = [post.date, post.region, post.genre]
          .filter(Boolean)
          .join(' ');

        div.appendChild(meta);

        if (post.summary) {
          const summaryDiv = document.createElement('div');
          summaryDiv.className = 'record-summary';
          summaryDiv.textContent = post.summary;
          div.appendChild(summaryDiv);
        }
      }

      container.appendChild(div);
    });

  } catch (e) {
    console.error('Blogger最新記事の表示に失敗:', e);
  }
}

