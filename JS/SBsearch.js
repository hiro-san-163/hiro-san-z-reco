// 山行記録 検索・一覧表示用スクリプト
(async function () {
  'use strict';

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  /* ---------- データ取得 ---------- */
  const resp = await fetch('data/SBrecords.json');
  if (!resp.ok) return;

  const raw = await resp.json();
  // データ源の形式が複数存在する可能性に対応
  // 1. 配列として直接データがある場合
  // 2. records というキー配下にある場合
  // 3. items というキー配下にある場合
  // 4. その他の場合は Object.values() で値を抽出
  const records = Array.isArray(raw)
    ? raw
    : (raw.records || raw.items || Object.values(raw));

  const norm = records.map(r => ({
    date: r.date_s || '',
    area: r.area || '',
    genre: r.genre || '',
    title: r.title || '',
    summary: r.summary || '',
    url: r.yamareco_url || r.url || ''
  })).filter(r => r.date || r.title);

  // 日付文字列から西暦4桁を抽出
  // 例: "2025-12-15", "2025年12月15日" → 2025
  const toYear = d => {
    const m = String(d).match(/(\d{4})/);  // 最初の4桁の連続する数字を抽出
    return m ? Number(m[1]) : null;
  };

  // ★追加：日付文字列から月を抽出
  // 例: "2025-12-15", "2025年12月15日" → 12
  const toMonth = d => {
    if (!d) return null;
    const m1 = String(d).match(/\d{4}[-\/](\d{1,2})/);
    if (m1) return Number(m1[1]);
    const m2 = String(d).match(/\d{4}年(\d{1,2})月/);
    if (m2) return Number(m2[1]);
    return null;
  };

  // 日付文字列をソート可能な数値に変換
  // 無効な日付は0を返す（ソート時に最後尾に配列される）
  const safeDate = d =>
    isNaN(Date.parse(d)) ? 0 : Date.parse(d);

  /* ---------- DOM ---------- */
  const header = document.querySelector('.search-header');
  const filters = document.querySelector('.filters');

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

  /* ---------- ページング状態 ---------- */
  let currentPage = 1;
  let totalPages = 1;
  let filteredData = [];

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

  fillSelect(yearSel, '年',
    [...new Set(norm.map(r => toYear(r.date)).filter(Boolean))].sort((a, b) => b - a)
  );
  fillSelect(monthSel, '月',
    [...new Set(norm.map(r => toMonth(r.date)).filter(Boolean))].sort((a, b) => a - b)
  );
  fillSelect(areaSel, '山域', [...new Set(norm.map(r => r.area).filter(Boolean))]);
  fillSelect(genreSel, 'ジャンル', [...new Set(norm.map(r => r.genre).filter(Boolean))]);

  /* ---------- ソート関数 ---------- */
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

  /* ---------- 結果描画 ---------- */
  function renderResults() {
    const pageSize = Number(pageSizeInput.value) || 20;
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const pageData = filteredData.slice(startIdx, endIdx);

    listEl.innerHTML = '';
    pageData.forEach(r => {
      const card = document.createElement('div');
      card.className = 'card';
      
      if (isMobile) {
        // スマホ版：メタ情報→タイトル（リンク化）
        card.innerHTML = `
          <div class="meta">${r.date} / ${r.area} / ${r.genre}</div>
          <div class="title"><a href="${r.url}" target="_blank">${r.title}</a></div>
        `;
      } else {
        // PC版：従来通り
        card.innerHTML = `
          <div class="date">${r.date}</div>
          <div class="title"><a href="${r.url}" target="_blank">${r.title}</a></div>
          <div class="meta">山域：${r.area} / ジャンル：${r.genre}</div>
          ${r.url ? `<a class="btn" href="${r.url}" target="_blank">記事を開く</a>` : ''}
        `;
      }
       // ★これ追加
  card.style.cursor = 'pointer';
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    if (r.url) window.open(r.url, '_blank');
  });
      
      listEl.appendChild(card);
    });
  }

  /* ---------- フィルタ ---------- */
  // 選択したフィルタ条件を適用してデータを絞り込み・ソート・ページング
  function applyFilters() {
    // 各フィルタの選択値を取得
    const y = yearSel.value;      // 年フィルタ
    const m = monthSel.value;     // 月フィルタ
    const a = areaSel.value;      // 山域フィルタ
    const g = genreSel.value;     // ジャンル フィルタ
    // キーワード検索：複数キーワードをスペース区切りで指定可能
    // 「全キーワードを含む」AND検索を実行（空文字列は除外）
    const keywords = keywordInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const sortType = sortSel.value;

    // 各フィルタ条件は AND で結合（全て満たす必要あり）
    let filtered = norm.filter(r => {
      if (y && toYear(r.date) !== Number(y)) return false;
      if (m && toMonth(r.date) !== Number(m)) return false;
      if (a && r.area !== a) return false;
      if (g && r.genre !== g) return false;
      if (keywords.length) {
        // タイトルと概要を対象に全キーワードでマッチ判定
        const text = `${r.title} ${r.summary}`.toLowerCase();
        // every()で全キーワードが含まれることを確認（AND検索）
        return keywords.every(k => text.includes(k));
      }
      return true;
    });

    // ソート適用
    filteredData = sortData(filtered, sortType);
    currentPage = 1;  // フィルタ変更時はページをリセット
    const pageSize = Number(pageSizeInput.value) || 20;
    totalPages = Math.ceil(filteredData.length / pageSize) || 1;

    countEl.textContent =
      `該当件数：${filteredData.length}件 / 全${norm.length}件`;

    renderResults();
    renderPagination();
  }

  /* ---------- スマホUI ---------- */
  if (isMobile) {

    // 検索ボタン（filters 内・固定）
    const searchBtn = document.createElement('button');
    searchBtn.type = 'button';
    searchBtn.className = 'search-apply-btn';
    searchBtn.textContent = '検索する';
    filters.appendChild(searchBtn);

    // サマリー（再検索はここだけ）
    const summary = document.createElement('div');
    summary.className = 'search-summary';
    summary.hidden = true;
    summary.innerHTML = `
      <div class="summary-text"></div>
      <button class="summary-edit">条件を変更</button>
    `;
    header.after(summary);

    function buildSummary() {
      const p = [];
      if (yearSel.value) p.push(`年=${yearSel.value}`);
      if (monthSel.value) p.push(`月=${monthSel.value}`);
      if (areaSel.value) p.push(`山域=${areaSel.value}`);
      if (genreSel.value) p.push(`ジャンル=${genreSel.value}`);
      if (keywordInput.value.trim()) p.push(`KW=${keywordInput.value.trim()}`);
      return p.join(' / ') || 'すべて';
    }

    searchBtn.onclick = () => {
      applyFilters();
      header.classList.add('cond-hidden');
      summary.hidden = false;
      summary.querySelector('.summary-text').textContent =
        `検索条件：${buildSummary()}`;
    };

    summary.querySelector('.summary-edit').onclick = () => {
      header.classList.remove('cond-hidden');
      summary.hidden = true;
    };

    // 初期表示：新しい順に全件表示
    applyFilters();

  } else {
    // PC：従来通り即時検索
    [yearSel, monthSel, areaSel, genreSel, sortSel, pageSizeInput]
      .forEach(el => el.addEventListener('change', applyFilters));
    keywordInput.addEventListener('input', applyFilters);
    applyFilters();
  }

})();
