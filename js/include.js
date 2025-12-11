// header / footer を読み込む関数
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

// 現在のページのパスから階層の深さを判定
// 例:
//  /index.html               → ["", "index.html"] → depth = 1
//  /records/index.html       → ["", "records", "index.html"] → depth = 2
//  /records/2025/xxx.html    → ["", "records", "2025", "xxx.html"] → depth = 3
const pathParts = window.location.pathname.split("/").filter(p => p !== "");
const depth = pathParts.length;

// depth に応じて ../ を作る（トップ=0）
let root = "";
for (let i = 1; i < depth; i++) {
  root += "../";
}

// HTMLを読み込む
loadPart("header", `${root}header.html`);
loadPart("footer", `${root}footer.html`);


