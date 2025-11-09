<!-- Bloggerから最新5件を取得 -->
<script>
  const container = document.getElementById("blog-cards");
  if (!container) {
    console.error("#blog-cards が見つかりません。");
  } else {
    const bloggerFeed = "https://hiro-san-163.blogspot.com/feeds/posts/default?alt=rss&max-results=5";
    const feedURL = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(bloggerFeed);

    fetch(feedURL)
      .then(response => {
        if (!response.ok) throw new Error("HTTPエラー: " + response.status);
        return response.json();
      })
      .then(data => {
        if (!data.items || data.items.length === 0) {
          container.innerHTML = "<p style='color:#888;'>記事が見つかりませんでした。</p>";
          return;
        }

        let output = "";
        data.items.forEach(item => {
          const date = new Date(item.pubDate).toLocaleDateString("ja-JP", {
            year: "numeric", month: "short", day: "numeric"
          });
          const thumb = item.thumbnail || (item.enclosure && item.enclosure.link) || "https://via.placeholder.com/300x180?text=No+Image";

          output += `
            <div class="blog-card">
              <a href="${item.link}" target="_blank" rel="noopener">
                <img src="${thumb}" alt="${item.title}">
                <div class="blog-card-text">
                  <h3>${item.title}</h3>
                  <p>${date}</p>
                </div>
              </a>
            </div>
          `;
        });

        container.innerHTML = output;
      })
      .catch(err => {
        console.error("記事取得エラー:", err);
        container.innerHTML = "<p style='color:#888;'>記事を読み込めませんでした。</p>";
      });
  }
</script>
