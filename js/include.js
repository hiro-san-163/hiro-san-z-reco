function loadPart(id, url) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Failed load: " + url);
      return res.text();
    })
    .then(html => {
      document.getElementById(id).innerHTML = html;
    })
    .catch(err => console.error(err));
}

// --- ▼ スマホでもズレない pathname 判定 ▼ ---
let path = window.location.pathname;

// スマホで "/" の場合は index.html とみなす
if (path === "/") {
  path = "/index.html";
}

const parts = path.split("/").filter(p => p.length > 0);
const depth = parts.length;

// --- ▼ depth からルートパスを算出 ---
let root = "";
for (let i = 1; i < depth; i++) {
  root += "../";
}

// --- ▼ キャッシュ破壊パラメータ ---
const v = "20250205";

// --- ▼ header/footer を読み込み ---
loadPart("header", `${root}header.html?v=${v}`);
loadPart("footer", `${root}footer.html?v=${v}`);
