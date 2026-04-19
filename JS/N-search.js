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

const labelMap = {
  records: '通常',
  SBrecords: 'SB',
  STrecords: 'ST'
};

let cache = {};
let norm = [];
let filteredData = [];
let currentPage = 1;
let totalPages = 1;

/* ---------- dataSource生成 ---------- */
function initDataSourceSelect() {
  dataSourceSel.innerHTML = '';

  const all = new Option('すべて', 'all');
  dataSourceSel.appendChild(all);

  Object.keys(DATA_FILES).forEach(key => {
    dataSourceSel.appendChild(new Option(labelMap[key], key));
  });

  // ★修正：multiple用のsize削除（プルダウン化）
  all.selected = true;
}

/* ---------- checkbox ---------- */
function initCheckboxes() {
  const box = document.getElementById('dataSourceCheckboxes');
  box.innerHTML = '';

  box.appendChild(createCB('all', 'すべて', true));

  Object.keys(DATA_FILES).forEach(key => {
    box.appendChild(createCB(key, labelMap[key], false));
  });
}

function createCB(value, label, checked) {
  const l = document.createElement('label');
  const i = document.createElement('input');
  i.type = 'checkbox';
  i.value = value;
  i.checked = checked;
  l.appendChild(i);
  l.append(` ${label}`);
  return l;
}

/* ---------- 選択取得 ---------- */
function getSelectedSources() {

  if (isMobile) {
    const v = [...document.querySelectorAll('#dataSourceCheckboxes input:checked')]
      .map(i => i.value);

    return v.includes('all') ? Object.keys(DATA_FILES) : v;
  }

  // ★修正：single select対応
  const v = dataSourceSel.value;
  return v === 'all' ? Object.keys(DATA_FILES) : [v];
}

/* ---------- データ取得 ---------- */
async function loadData(sources) {

  const key = sources.sort().join(',');
  if (cache[key]) return cache[key];

  const results = await Promise.all(
    sources.map(async src => {
      const resp = await fetch(DATA_FILES[src]);
      if (!resp.ok) return [];

      const raw = await resp.json();
      const arr = Array.isArray(raw)
        ? raw
        : (raw.records || raw.items || Object.values(raw));

      return arr.map(r => ({
        ...r,
        source: src,
        sourceLabel: labelMap[src]
      }));
    })
  );

  return cache[key] = results.flat();
}

/* ---------- 初期化 ---------- */
async function initData() {

  loading.style.display = 'flex';

  const sources = getSelectedSources();
  const rawData = await loadData(sources);

  norm = rawData.map(r => ({
    date: r.date_s || '',
    area: r.area || '',
    genre: r.genre || '',
    title: r.title || '',
    summary: r.summary || '',
    url: r.yamareco_url || r.url || '',
    source: r.source,
    sourceLabel: r.sourceLabel,
    searchText: `${r.title} ${r.summary}`.toLowerCase()
  })).filter(r => r.date || r.title);

  fillAllSelects();

  loading.style.display = 'none';
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
         <div class="title">
           <a href="${r.url}" target="_blank">${r.title}</a>
           <span class="source-tag source-${r.source}">${r.sourceLabel}</span>
         </div>`
      : `<div class="date">${r.date}</div>
         <div class="title">
           <a href="${r.url}" target="_blank">${r.title}</a>
           <span class="source-tag source-${r.source}">${r.sourceLabel}</span>
         </div>
         <div class="meta">山域：${r.area} / ジャンル：${r.genre}</div>`;

    card.onclick = e => {
      if (!e.target.closest('a') && r.url) {
        window.open(r.url, '_blank');
      }
    };

    listEl.appendChild(card);
  });
}

/* ---------- ヘルパー関数 ---------- */
function toYear(d) {
  const m = String(d).match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}

function toMonth(d) {
  if (!d) return null;
  const m1 = String(d).match(/\d{4}[-\/](\d{1,2})/);
  if (m1) return Number(m1[1]);
  const m2 = String(d).match(/\d{4}年(\d{1,2})月/);
  if (m2) return Number(m2[1]);
  return null;
}

function safeDate(d) {
  return isNaN(Date.parse(d)) ? 0 : Date.parse(d);
}

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

/* ---------- セレクト生成 ---------- */
function fillAllSelects() {
  function fillSelect(sel, label, values) {
    if (!sel) return;
    sel.innerHTML = `<option value="">${label}：すべて</option>`;
    values.forEach(v => {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = v;
      sel.appendChild(o);
    });
  }

  fillSelect(yearSel, '年',
    [...new Set(norm.map(r => toYear(r.date)).filter(Boolean))].sort((a, b) => b - a)
  );
  fillSelect(monthSel, '月',
    [...new Set(norm.map(r => toMonth(r.date)).filter(Boolean))].sort((a, b) => a - b)
  );
  fillSelect(areaSel, '山域', [...new Set(norm.map(r => r.area).filter(Boolean))]);
  fillSelect(genreSel, 'ジャンル', [...new Set(norm.map(r => r.genre).filter(Boolean))]);
}

/* ---------- フィルタ ---------- */
function applyFilters() {
  const y = yearSel.value;
  const m = monthSel.value;
  const a = areaSel.value;
  const g = genreSel.value;

  const keywords = keywordInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const sortType = sortSel.value;

  let filtered = norm.filter(r => {
    if (y && toYear(r.date) !== Number(y)) return false;
    if (m && toMonth(r.date) !== Number(m)) return false;
    if (a && r.area !== a) return false;
    if (g && r.genre !== g) return false;
    if (keywords.length) {
      const text = r.searchText;
      return keywords.every(k => text.includes(k));
    }
    return true;
  });

  filteredData = sortData(filtered, sortType);
  currentPage = 1;

  const pageSize = Number(pageSizeInput.value) || 20;
  totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  countEl.textContent =
    `該当件数：${filteredData.length}件 / 全${norm.length}件`;

  renderResults();
  renderPagination();
}

/* ---------- ページング描画 ---------- */
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

/* ---------- イベント ---------- */
yearSel.addEventListener('change', applyFilters);
monthSel.addEventListener('change', applyFilters);
areaSel.addEventListener('change', applyFilters);
genreSel.addEventListener('change', applyFilters);
sortSel.addEventListener('change', applyFilters);
pageSizeInput.addEventListener('change', applyFilters);

/* ★修正：キーワード確定型 */
keywordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') applyFilters();
});
keywordInput.addEventListener('blur', applyFilters);

/* ★修正：データソース変更時 */
dataSourceSel.addEventListener('change', async () => {
  await initData();
  applyFilters();
});

/* ---------- 起動 ---------- */
initDataSourceSelect();
if (isMobile) initCheckboxes();

/* ★修正：スマホ検索ボタン復活 */
if (isMobile) {
  const btn = document.createElement('button');
  btn.textContent = '検索する';
  btn.className = 'search-apply-btn';
  filters.appendChild(btn);

  btn.onclick = () => {
    applyFilters();
  };
}

await initData();
applyFilters();

});
