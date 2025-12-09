// 現在のページのパスからルートまでの距離を判断
const depth = window.location.pathname.split("/").length - 2; 
// 例） /index.html → depth=1
//      /records/index.html → depth=2
//      /records/2025/xxx.html → depth=4 など

// "../" を depth-1 回つなげてルートパスを生成
let root = "";
for (let i = 1; i < depth; i++) {
  root += "../";
}

// 読み込み実行
loadPart("header", `${root}header.html`);
loadPart("footer", `${root}footer.html`);


