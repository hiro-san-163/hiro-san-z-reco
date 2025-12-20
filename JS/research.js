// js/research.js
// 山行記録 検索・一覧表示用スクリプト
// records.json はルート直下に配置されている前提

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
    : (raw.records || raw.items || raw.data || Object.values(raw));

  /* ---------- 正規化 ---------- */
  const norm = records.map(r => ({
    date:  r.date  || r.Date  || r['日付']     || '',
    area:  r.area  || r.Area  || r['山域']     || '',
    genre: r.genre || r.Genre || r['ジャンル'] || '',
    title: r.title || r.Title || r['タイトル'] || r.place || r['場所'] || '',
    url:   r.yamareco_url || r.url || r.URL || r.link || ''
  }))
  .filter(r => r.date || r.title);

  /* ---------- ユーティリティ ---------- */
  function toYear(d) {
    if (!d) return null;
    const m = String(d).match(/(\d{4})/);
    return m ? Number(m[1]) : null;
  }

  function safeDate(d) {
    const t = Date.parse(d);
    return isNaN(t) ? 0 : t;
  }

  /* ---------- セレクト生成 ---------- */
  const years  = Array.from(new Set(norm.map(r => toYear(r.date)).filter(Boolean))).sort((a, b) => b - a);
  const areas  = Array.from(new Set(norm.map(r => r.area).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'ja'));
  const genres = Array.from(new Set(norm.map(r => r.genre).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'ja'));

  const yearSel  = document.getElementById('year');
  const areaSel  = document.getElementById('area');
  const genreSel = document.getElementById('genre');
  const sortSel  = document.getElementById('sort');

  const pageSizeInput = document.getElementById('pageSize');
  const countEl = document.getElementById('count');
  const listEl  = document.getElementById('list');
  const pagerEl = document.getElementById('pagination');

  function fillSelect(sel, label, values) {
    sel.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = `${label}：すべて`;
    sel.appendChild(optAll);

    values.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }

  fillSelect(yearSel,  '年', years);
  fillSelect(areaSel,  '山域', areas);
  fillSelect(genreSel, 'ジャンル', genres);

  /* ---------- 状態 ---------- */
  let currentPage = 1;
  let focusedCard = null;

  /* ---------- フィルタ・ソート ---------- */
  function applyFilters() {
    const y = yearSel.value;
    const a = areaSel.value;
    const g = genreSel.value;

    let filtered = norm.filter(r =>
      (!y || toYear(r.date) === Number(y)) &&
      (!a || r.area === a) &&
      (!g || r.genre === g)
    );

    switch (sortSel.value) {
      case 'date_asc':
        filtered.sort((r1, r2) => safeDate(r1.date) - safeDate(r2.date));
        break;
      case 'title_asc':
        filtered.sort((r1, r2) => String(r1.title).localeCompare(String(r2.title), 'ja'));
        break;
      case 'title_desc':
        filtered.sort((r1, r2) => String(r2.title).localeCompare(String(r1.title), 'ja'));
        break;
      default:
        filtered.sort((r1, r2) => safeDate(r2.date) - safeDate(r1.date));
    }

    renderList(filtered);
  }

  /* ---------- 描画 ---------- */
  function renderList(items) {
    const pageSize = Math.max(5, Math.min(100, Number(pageSizeInput.value) || 20));
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    if (currentPage > totalPages) currentPage = 1;

    countEl.textContent = `該当件数：${total}件 / ページサイズ：${pageSize}`;

    const start = (currentPage - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    listEl.innerHTML = '';
    focusedCard = null;

    if (pageItems.length === 0) {
      listEl.innerHTML = '<div class="empty">該当する記録がありません</div>';
      return;
    }

    const frag = document.createDocumentFragment();

    pageItems.forEach(r => {
      const card = document.createElement('div');
      card.className = 'card';
      card.tabIndex = 0;
      card.dataset.url = r.url || '';

      card.innerHTML = `
        <div class="date">${r.date || ''}</div>
        <div class="title">${r.title || '(タイトル未設定)'}</div>
        <div class="meta">山域：${r.area || '-'}　ジャンル：${r.genre || '-'}</div>
      `;

      if (r.url) {
        const actions = document.createElement('div');
        actions.className = 'actions';
        const a = document.createElement('a');
        a.className = 'btn';
        a.href = r.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = '記事を開く';
        actions.appendChild(a);
        card.appendChild(actions);
      }

      card.addEventListener('mouseenter', () => {
        if (focusedCard) focusedCard.classList.remove('is-focused');
        focusedCard = card;
        card.classList.add('is-focused');
      });

      card.addEventListener('mouseleave', () => {
        card.classList.remove('is-focused');
        focusedCard = null;
      });

      card.addEventListener('dblclick', () => {
        if (card.dataset.url) window.open(card.dataset.url, '_blank');
      });

      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' && card.dataset.url) {
          window.open(card.dataset.url, '_blank');
        }
      });

      frag.appendChild(card);
    });

    listEl.appendChild(frag);

    /* ---------- ページャ ---------- */
    pagerEl.innerHTML = '';

    function addBtn(label, page, disabled = false, active = false) {
      const b = document.createElement('button');
      b.textContent = label;
      if (disabled) b.disabled = true;
      if (active) b.classList.add('active');
      b.addEventListener('click', () => {
        currentPage = page;
        renderList(items);
      });
      pagerEl.appendChild(b);
    }

    addBtn('« 先頭', 1, currentPage === 1);
    addBtn('‹ 前', Math.max(1, currentPage - 1), currentPage === 1);

    const windowSize = 5;
    let startPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let endPage = Math.min(totalPages, startPage + windowSize - 1);
    if (endPage - startPage + 1 < windowSize) {
      startPage = Math.max(1, endPage - windowSize + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      addBtn(String(p), p, false, p === currentPage);
    }

    addBtn('次 ›', Math.min(totalPages, currentPage + 1), currentPage === totalPages);
    addBtn('最後 »', totalPages, currentPage === totalPages);
  }

  /* ---------- イベント ---------- */
  [yearSel, areaSel, genreSel, sortSel, pageSizeInput].forEach(el =>
    el.addEventListener('change', () => {
      currentPage = 1;
      applyFilters();
    })
  );

  document.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;

    const cards = Array.from(document.querySelectorAll('.card'));
    if (!cards.length) return;

    let index = focusedCard ? cards.indexOf(focusedCard) : -1;

    index = e.key === 'ArrowDown'
      ? Math.min(cards.length - 1, index + 1)
      : Math.max(0, index - 1);

    if (focusedCard) focusedCard.classList.remove('is-focused');
    focusedCard = cards[index];

    if (focusedCard) {
      focusedCard.classList.add('is-focused');
      focusedCard.focus();
      focusedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  applyFilters();
})();
