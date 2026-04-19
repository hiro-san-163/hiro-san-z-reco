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

  dataSourceSel.size = dataSourceSel.options.length;
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

  const v = [...dataSourceSel.selectedOptions].map(o => o.value);
  return v.includes('all') ? Object.keys(DATA_FILES) : v;
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

/* ---------- イベント ---------- */
dataSourceSel.addEventListener('change', async () => {
  await initData();
  applyFilters();
});

document.getElementById('dataSourceCheckboxes')
  .addEventListener('change', async () => {
    await initData();
    applyFilters();
  });

/* ---------- 起動 ---------- */
initDataSourceSelect();
if (isMobile) initCheckboxes();

await initData();
applyFilters();

});