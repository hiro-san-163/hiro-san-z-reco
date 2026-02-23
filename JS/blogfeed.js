window.BLOG_URL = "https://hiro-san-163.blogspot.com";

function renderLatestBlogPosts({ target = "#latest-records", max = 3 }) {

  window.__latestContainerSelector = target;

  const script = document.createElement("script");
  script.src =
    `${BLOG_URL}/feeds/posts/default?alt=json-in-script&max-results=${max}&callback=handleLatestPosts`;

  document.body.appendChild(script);
}

function extractPostContent(htmlContent) {

  const temp = document.createElement("div");
  temp.innerHTML = htmlContent;

  const card = temp.querySelector(".rec-card");
  if (!card) return {};

  let date="", area="", genre="";

  card.querySelectorAll(".rec-info p").forEach(p=>{
    const t=p.innerText;
    if(t.includes("実施日")) date=t.replace("実施日：","").trim();
    if(t.includes("山域")) area=t.replace("山域：","").trim();
    if(t.includes("ジャンル")) genre=t.replace("ジャンル：","").trim();
  });

  const img = card.querySelector(".rec-main-photo img");
  const image = img ? img.src : "";

  const summaryEl = card.querySelector(".rec-summary");
  const summary = summaryEl ? summaryEl.innerText.trim().substring(0,120) : "";

  return { date, area, genre, summary, image };
}

window.handleLatestPosts = function(data){

  const container = document.querySelector(window.__latestContainerSelector);
  if(!container) return;

  container.innerHTML="";

  data.feed.entry.forEach(entry=>{

    const title = entry.title.$t;
    const link = entry.link.find(l=>l.rel==="alternate").href;

    const info = extractPostContent(entry.content.$t);

    const article=document.createElement("article");
    article.className="record-card";

    article.innerHTML=`
      <div class="record-header">
        <div class="record-thumb">
          ${info.image ? `<img src="${info.image}" alt="${title}">` : ""}
        </div>
        <div class="record-meta">
          <h3 class="record-title">
            <a href="${link}" target="_blank">${title}</a>
          </h3>
          <div class="record-info">
            ${info.date ? `<span>実施日：${info.date}</span>` : ""}
            ${info.area ? `<span>山域：${info.area}</span>` : ""}
            ${info.genre ? `<span>ジャンル：${info.genre}</span>` : ""}
          </div>
        </div>
      </div>
      ${info.summary ? `<div class="record-summary">${info.summary}…</div>` : ""}
    `;

    container.appendChild(article);
  });
};