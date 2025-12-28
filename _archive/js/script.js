// ファイルパスの設定
const PATHS = {
  header: '../header.html',
  footer: '../footer.html'
};

// ヘッダ・フッタを読み込む（統合関数）
async function loadPartial(filePath, targetId) {
  try {
    const target = document.getElementById(targetId);
    if (!target) {
      console.warn(`ターゲット要素が見つかりません: #${targetId}`);
      return false;
    }

    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const html = await res.text();
    target.insertAdjacentHTML('beforeend', html);
    return true;
  } catch (e) {
    console.error(`パーティアル読み込み失敗 (${filePath}):`, e);
    return false;
  }
}

// ヘッダ・フッタを読み込み
async function loadHeaderFooter() {
  await Promise.all([
    loadPartial(PATHS.header, 'header-target'),
    loadPartial(PATHS.footer, 'footer-target')
  ]);
}

// ナビゲーション トグル初期化
function initNavToggle() {
  const toggleBtn = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');

  if (!toggleBtn || !mainNav) {
    console.warn('ナビゲーション要素が見つかりません');
    return;
  }

  toggleBtn.addEventListener('click', (ev) => {
    ev.preventDefault();
    mainNav.classList.toggle('nav-active');
  });

  // 外側クリックでナビを閉じる
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('#nav-toggle') && !ev.target.closest('#main-nav')) {
      mainNav.classList.remove('nav-active');
    }
  });
}

// レコード要素を作成
function createRecordElement(item) {
  const {
    title = '無題',
    link = '#',
    date = '',
    region = '',
    genre = '',
    thumbnail = ''
  } = item;

  const article = document.createElement('article');
  article.className = 'record-card';

  // サムネイル画像
  if (thumbnail) {
    const img = document.createElement('img');
    img.src = thumbnail;
    img.alt = title;
    img.loading = 'lazy';
    img.className = 'record-thumbnail';
    img.style.cursor = 'pointer';
    
    img.addEventListener('click', () => {
      window.open(link, '_blank', 'noopener,noreferrer');
    });
    
    article.appendChild(img);
  }

  // タイトル
  const h3 = document.createElement('h3');
  h3.className = 'record-title';
  const a = document.createElement('a');
  a.href = link;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = title;
  h3.appendChild(a);
  article.appendChild(h3);

  // メタ情報（日付・地域・ジャンル）
  const meta = document.createElement('div');
  meta.className = 'record-meta';
  meta.textContent = [date, region, genre].filter(Boolean).join(' / ');
  article.appendChild(meta);

  return article;
}


