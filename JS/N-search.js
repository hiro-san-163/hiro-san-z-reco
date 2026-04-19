document.addEventListener("DOMContentLoaded", async () => {

  'use strict';

  if (window.partsLoaded) {
    await window.partsLoaded;
  }

  await new Promise(r => setTimeout(r, 50));

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  /* ---------- DOM ---------- */
  const loading = document.getElementById('loading');

  const header = document.querySelector('.search-header');
  const filters = document.querySelector('.filters');

  const dataSourceSel = document.getElementById('dataSource');

  const yearSel = document.getElementById('year');
  const monthSel = document.getElementById('month');
  const areaSel = document.getElementById('area');
  const genreSel = document.getElementById('genre');
  const sortSel = document.getElementById('sort');
  const pageSizeInput = document.getElementById('pageSize');
  const keywordInput = document.getElementById('keyword');

  const countEl = document.getElementById('count');
  const listEl = document.getElementById('list');
  const paginationEl = document.getElementById('pagination');

  /* ---------- データ ---------- */
  const DATA_FILES = {
    records: 'data/records.json',
    SBrecords: 'data/SBrecords.json',
    STrecords: 'data/STrecords.json'
  };

  let cache = {};
  let norm = [];
  let filteredData = [];
  let currentPage = 1;
  let totalPages = 1;

  /* ---------- debounce ---------- */
  function debounce(fn, delay) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  const debouncedSearch = debounce(applyFilters, 300);

  /* ---------- データ取得 ---------- */
  async function loadData(source) {

    if (cache[source]) return cache[source];

    if (source === 'all') {
      const results = await Promise.all(
        Object.entries(DATA_FILES).map(async ([key, path]) => {
          const resp = await fetch(path);
          if (!resp.ok) return [];

          const raw = await resp.json();

          const arr = Array.isArray(raw)
            ? raw
            : (raw.records || raw.items || Object.values(raw));

          return arr.map(r => ({ ...r, source: key }));
        })
      );

      return cache[source] = results.flat();
    }

    const resp = await fetch(DATA_FILES[source]);
    if (!resp.ok) return [];

    const raw = await resp.json();

    const arr = Array.isArray(raw)
      ? raw
      : (raw.records || raw.items || Object.values(raw));

    return cache[source] = arr.map(r => ({ ...r, source }));
  }

  /* ---------- 初期化 ---------- */
  async function initData() {

    loading.style.display = 'flex';

    const source = dataSourceSel?.value || 'all';
    const rawData = await loadData(source);

    norm = rawData.map(r => ({
      date: r.date_s || '',
      area: r.area || '',
      genre: r.genre || '',
      title: r.title || '',
      summary: r.summary || '',
      url: r.yamareco_url || r.url || '',
      source: r.source || '',
      searchText: `${r.title} ${r.summary}`.toLowerCase() // ★最適化
    })).filter(r => r.date || r.title);

    fillAllSelects();

    loading.style.display = 'none';
  }

  /* ---------- ユーティリティ ---------- */
  const toYear = d => {
    const m = String(d).match(/(\d{4})/);
    return m ? Number(m[1]) : null;
  };

  const toMonth = d => {
    if (!d) return null;
    const m1 = String(d).match(/\d{4}[-\/](\d{1,2})/);
    if (m1) return Number(m1[1]);
    const m2 = String(d).match(/\d{4}年(\d{1,2})月/);
    if (m2) return Number(m2[1]);
    return null;
  };

  const safeDate = d =>
    isNaN(Date.parse(d)) ? 0 : Date.parse(d);

  /* ---------- セレクト生成 ---------- */
  function fillSelect(sel, label, values) {
    sel.innerHTML = `<option value="">${label}：すべて</option>`;
    values.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }

  function fillAllSelects() {
    fillSelect(yearSel, '年',
      [...new Set(norm.map(r => toYear(r.date)).filter(Boolean))].sort((a, b) => b - a)
    );
    fillSelect(monthSel, '月',
      [...new Set(norm.map(r => toMonth(r.date)).filter(Boolean))].sort((a, b) => a - b)
    );
    fillSelect(areaSel, '山域',
      [...new Set(norm.map(r => r.area).filter(Boolean))]
    );
    fillSelect(genreSel, 'ジャンル',
      [...new Set(norm.map(r => r.genre).filter(Boolean))]
    );
  }

  /* ---------- ソート ---------- */
  function sortData(data, sortType) {
    const sorted = [...data];
    switch (sortType) {
      case 'date_asc':
        sorted.sort((a, b) => safeDate(a.date) - safeDate(b.date));
        break;
      case 'date_desc':
        sorted.sort((a, b) => safeDate(b.date) - safeDate(a.date));
        break;
      case 'title_asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
        break;
      case 'title_desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title, 'ja'));
        break;
      default:
        sorted.sort((a, b) => safeDate(b.date) - safeDate(a.date));
    }
    return sorted;
  }

  /* ---------- 描画 ---------- */
  function renderResults() {

    const pageSize = Number(pageSizeInput.value) || 20;
    const startIdx = (currentPage - 1) * pageSize;
    const pageData = filteredData.slice(startIdx, startIdx + pageSize);

    listEl.innerHTML = '';

    pageData.forEach(r => {
      const card = document.createElement('div');
      card.className = 'card';

      card.innerHTML = isMobile
        ? `<div class="meta">${r.date} / ${r.area} / ${r.genre}</div>
           <div class="title"><a href="${r.url}" target="_blank">${r.title}</a></div>`
        : `<div class="date">${r.date}</div>
           <div class="title"><a href="${r.url}" target="_blank">${r.title}</a></div>
           <div class="meta">山域：${r.area} / ジャンル：${r.genre}</div>`;

      card.onclick = e => {
        if (!e.target.closest('a') && r.url) {
          window.open(r.url, '_blank');
        }
      };

      listEl.appendChild(card);
    });
  }

  function renderPagination() {
    paginationEl.innerHTML = '';
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === currentPage) btn.classList.add('active');
      btn.onclick = () => {
        currentPage = i;
        renderResults();
      };
      paginationEl.appendChild(btn);
    }
  }

  /* ---------- フィルタ ---------- */
  function applyFilters() {

    const y = yearSel.value;
    const m = monthSel.value;
    const a = areaSel.value;
    const g = genreSel.value;

    const keywords = keywordInput.value
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    let filtered = norm.filter(r => {

      if (y && toYear(r.date) !== Number(y)) return false;
      if (m && toMonth(r.date) !== Number(m)) return false;
      if (a && r.area !== a) return false;
      if (g && r.genre !== g) return false;

      if (keywords.length) {
        return keywords.every(k => r.searchText.includes(k));
      }

      return true;
    });

    filteredData = sortData(filtered, sortSel.value);

    currentPage = 1;
    totalPages = Math.ceil(filteredData.length / (pageSizeInput.value || 20)) || 1;

    countEl.textContent =
      `該当件数：${filteredData.length}件 / 全${norm.length}件`;

    renderResults();
    renderPagination();
  }

  /* ---------- 初期化 ---------- */
  await initData();

  dataSourceSel.addEventListener('change', async () => {
    await initData();
    applyFilters();
  });

  /* ---------- UI ---------- */
  if (isMobile) {

    const btn = document.createElement('button');
    btn.textContent = '検索する';
    btn.className = 'search-apply-btn';
    filters.appendChild(btn);

    btn.onclick = async () => {
      await initData();
      applyFilters();
    };

    applyFilters();

  } else {

    [yearSel, monthSel, areaSel, genreSel, sortSel, pageSizeInput]
      .forEach(el => el.addEventListener('change', applyFilters));

    keywordInput.addEventListener('input', debouncedSearch);

    applyFilters();
  }

});
