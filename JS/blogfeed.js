/* =========================================================
   blogfeed.js  Step1+Step2 安全版
   ・fetch → 成功確認
   ・最新1件のみ返す
   ・項目名は変更しない
========================================================= */

const BLOG_JSON_URL =
  "https://hiro-san-163.github.io/hiro-san-z-reco/data/blogger.json";

/* ---- JSON取得 ---- */
async function fetchBlogJson() {
  const res = await fetch(BLOG_JSON_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("blogger.json fetch failed");
  }
  return await res.json();
}

/* ---- 最新1件を表示（共通） ---- */
async function renderLatestBlogPosts(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const entries = await fetchBlogJson();

    // 念のため配列確認
    if (!Array.isArray(entries) || entries.length === 0) {
      container.innerHTML = "<p>表示できる記録がありません</p>";
      return;
    }

    const e = entries[0]; // 最新1件のみ

    container.innerHTML = `
      <article class="latest-record-item">
        <div class="latest-record-meta">${e.date}</div>
        <a href="${e.link}" class="latest-record-title" target="_blank">
          ${e.title}
        </a>
      </article>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>山行記録の読み込みに失敗しました</p>";
  }
}

