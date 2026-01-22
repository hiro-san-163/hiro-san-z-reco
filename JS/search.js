// 山行記録 検索・一覧表示用スクリプト
// title + summary によるキーワード検索対応

(async function () {
  'use strict';

  /* ---------- データ取得 ---------- */
  const resp = await fetch('data/records.json');
  if (!resp.ok) {
    console.error('records.json の読み込みに失敗しました');
    return;
  }

  const raw = await resp.json();
  const records = Array.isArray(raw)
    ? raw
    : (raw.records || raw.items || Object.values(raw));

  /* ---------- 正規化（★ date に統一） ---------- */
  const norm = records.map(r => ({
    date: r.date_s || '',
    area: r.area || '',
    genre: r.genre || '',
    title: r.title || '',
    summary: r.summary || '',
    url: r.yamareco_url || r.url || ''
  })).filter(r => r.date || r.title);

  /* ---------- ユーティリティ ---------- */
  const toYear = d => {
    const m = String(d).match(/(\d{4})/);
    return m ? Number(m[1]) : null;
  };

  const safeDate = d =>
    isNaN(Date.parse(d)) ? 0 : Date.parse(d);

  /* ---------- セレクト生成 ---------- */
  const years = [...new Set(
    norm.map(r => toYear(r.date)).filter(Boolean)
  )].sort((a, b) => b - a);

  const areas = [...new Set(
    norm.map(r => r.area).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'ja'));

  const genres = [...new Set(
    norm.map(r => r.genre).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'ja'));

  const yearSel = document.getElementById('year');
  const areaSel = document.getElementById('area');
  const genreSel = document.getElementById('genre');
  const sortSel = document.getElementById('sort');
  const pageSizeInput = document.getElementById('pageSize');
  const keywordInput = document.getElementById('keyword');

  const countEl = document.getElementById('count');
  const listEl = document.getElementById('list');
  const pagerEl = document.getElementById('pagination');

  function fillSelect(sel, label, values) {
    sel.innerHTML = `<option value="">${label}：すべて</option>`;
    values.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }

  fillSelect(yearSel, '年', years);
  fillSelect(areaSel, '山域', areas);
  fillSelect(genreSel, 'ジャンル', genres);

  /* ---------- 状態 ---------- */
  let currentPage = 1;

  /* ---------- フィルタ ---------- */
  function applyFilters() {
    const y = yearSel.value;
    const a = areaSel.value;
    const g = genreSel.value;

    const keywords = keywordInput.value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    let filtered = norm.filter(r => {
      if (y && toYear(r.date) !== Number(y)) return false;
      if (a && r.area !== a) return false;
      if (g && r.genre !== g) return false;

      if (keywords.length) {
        const text = `${r.title} ${r.summary}`.toLowerCase();
        return keywords.every(k => text.includes(k));
      }
      return true;
    });

    switch (sortSel.value) {
      case 'date_s_asc':
        filtered.sort((a, b) => safeDate(a.date) - safeDate(b.date));
        break;
      case 'title_asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
        break;
      case 'title_desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title, 'ja'));
        break;
      default:
        filtered.sort((a, b) => safeDate(b.date) - safeDate(a.date));
    }

    currentPage = 1;
    renderList(filtered);
  }

  /* ---------- 描画 ---------- */
  function renderList(items) {
    const pageSize = Math.max(
      5,
      Math.min(100, Number(pageSizeInput.value) || 20)
    );

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    countEl.textContent =
      `該当件数：${total}件 / 全${norm.length}件`;

    const start = (currentPage - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    listEl.innerHTML = '';
    pagerEl.innerHTML = '';

    if (!pageItems.length) {
      listEl.innerHTML =
        '<div class="empty">該当する記録がありません</div>';
      return;
    }

    pageItems.forEach(r => {
      const card = document.createElement('div');
      card.className = 'card';

      const summary =
        r.summary
          ? r.summary.slice(0, 100) + (r.summary.length > 100 ? '…' : '')
          : '';

      card.innerHTML = `
        <div class="date">${r.date}</div>
        <div class="title">${r.title || '(タイトル未設定)'}</div>
        <div class="meta">
          山域：${r.area || '-'}　ジャンル：${r.genre || '-'}
        </div>
        ${summary ? `<div class="summary">${summary}</div>` : ''}
        ${r.url
          ? `<div class="actions">
               <a class="btn" href="${r.url}" target="_blank" rel="noopener">
                 記事を開く
               </a>
             </div>`
          : ''}
      `;
      listEl.appendChild(card);
    });

    for (let p = 1; p <= totalPages; p++) {
      const b = document.createElement('button');
      b.textContent = p;
      if (p === currentPage) b.classList.add('active');
      b.onclick = () => {
        currentPage = p;
        renderList(items);
      };
      pagerEl.appendChild(b);
    }
  }

  /* ---------- イベント ---------- */
  [yearSel, areaSel, genreSel, sortSel, pageSizeInput]
    .forEach(el => el.addEventListener('change', applyFilters));

  keywordInput.addEventListener('input', applyFilters);

  /* ---------- 初期表示 ---------- */
  applyFilters();
})();
