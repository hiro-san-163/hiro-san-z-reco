function loadPart(id, url) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Failed load: " + url);
      return res.text();
    })
    .then(html => {
      const target = document.getElementById(id);
      if (target) target.innerHTML = html;
    })
    .catch(err => console.error(err));
}

// キャッシュ対策
const v = "20250210";

// header / footer 読み込み
loadPart("header", "parts/header.html?v=${v}");
loadPart("footer", "parts/footer.html?v=${v}");
