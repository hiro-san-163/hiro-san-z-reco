
---

# hiro-san-z-reco

## 山行記録サイト構築・運用プロジェクト

### 概要

本リポジトリは、個人サイト **「hiro-sanの山歩き」** における
山行記録の **蓄積・整理・検索・再発見** を目的とした
**静的サイト構築および長期運用プロジェクト**である。

Blogger を山行記事の発信・保管基盤としつつ、
GitHub Pages 上に **自分用アーカイブ／検索UI** を構築することで、

* 記録が増えても破綻しない
* 手作業を極力増やさない
* 後から振り返りやすい

ことを重視して設計している。

---

## プロジェクトの位置づけ

本プロジェクトは、

* **初期構築フェーズ（完了）**
* **育成・安定運用フェーズ（現行）**

のうち、後者に位置づけられる。

「作って終わり」ではなく、
**記録が増え続ける前提で、構造とUIを育てていく**ことを基本方針とする。

---

## サイト構成の考え方

### 1. records ページ群（正規アーカイブ）

* `/records/year.html`
* `/records/area.html`
* `/records/genre.html`

年・山域・ジャンルという **固定軸**で整理された、
山行記録の正式アーカイブ。

分類ルールはシンプルに保ち、
表示・取得ロジックは JavaScript 側に集約している。

---

### 2. search ページ（横断ビュー）

`search.html` は、

> **「山行記録を一覧で眺めるページ」ではなく、
> 「過去の山行を探し出すためのデータベースUI」**

として位置づけている。

* records.json を基点としたクライアントサイド検索
* 年・山域・ジャンル・キーワードの複合条件
* 並び替え・ページング対応
* PC / スマートフォン両対応

将来的な検索機能拡張を前提とした **正式機能**である。

---

## 技術的前提

* 静的サイト（HTML / CSS / JavaScript）
* GitHub Pages 上で完結
* サーバーサイド処理なし
* Blogger は「記事生成・更新の基盤」として利用
* RSS / JSON / JSONP によるデータ取得
* `<base href>` を前提とした相対パス設計

---

## 設計思想（重要）

本プロジェクトでは、以下を一貫して重視している。

* **記録件数の増加を前提にする**
* HTML 構造は極力変えず、CSS / JS で調整する
* 表示崩れ・挙動不良は「場当たり修正」ではなく原因分離で解決
* 将来の拡張余地を残す
* 自分が数年後に見返して理解できること

---

## 現在の到達点

* 山行記録の整理・検索・閲覧は **実運用可能な状態**
* PC / スマホともに表示・操作が安定
* 記録追加時に HTML を修正する必要はほぼなし
* 設計方針・制約・判断理由は README に記録済み

本 README は
**「なぜこう作られているのか」を未来の自分に説明するための記録**でもある。

---

## 補足

詳細な改修履歴、設計判断の経緯、試行錯誤のログは
README 内の **メンテナンス履歴セクション**に時系列で残している。

---

この形にしておくと、

* GitHub に置いたときに「何のリポジトリか」が即分かる
* 数か月〜数年後に再開しても迷子にならない
* 「当面一段落したプロジェクト」として綺麗に区切れる

##　履歴　## 2026/02/14


```
現在、静的サイト（GitHub Pages）で山行記録サイトを構築中。

■ 構成
- index.html（トップページ）
- records/index.html（山行記録一覧）
- blog.html ほか
- CSS/style.css
- JS/blogfeed.js
- JS/include.js

■ 仕様
- 最新山行記録は Blogspot のフィードから取得
- JSONPで取得（handleLatestPosts）
- extractPostContent() で .rec-card 内から
  ・実施日
  ・山域
  ・ジャンル
  ・感想（100字）
  ・代表写真
  を抽出

■ 現在の表示構造
.record-card
  ├─ img.record-thumb（左）
  └─ div.record-content
       ├─ div.record-header（登録日＋タイトル 横1行）
       ├─ div.record-info（実施日・山域・ジャンル 横1行）
       └─ div.record-summary（感想）

■ 現在の状態
- 最新記事は正常表示
- 3件表示
- レイアウトは横並び
- 背景画像はやや抑えた設定済

次の改善点や設計整理を進めたい。
```

---

# ✅ ② README.md（プロジェクト用）

そのまま `README.md` に保存できます。

```markdown
# hiro-sanの山歩き

静的サイト（GitHub Pages）で構築した山行記録サイト。

---

## 📁 ディレクトリ構成

```

/
├─ index.html
├─ records/
│   └─ index.html
├─ blog.html
├─ about.html
├─ CSS/
│   └─ style.css
├─ JS/
│   ├─ blogfeed.js
│   └─ include.js
└─ favicon.ico

```

---

## 🔄 最新山行記録の仕組み

### データ取得元
Blogspot フィード

```

[https://hiro-san-163.blogspot.com/feeds/posts/default](https://hiro-san-163.blogspot.com/feeds/posts/default)

```

### 取得方式
JSONP（callback: handleLatestPosts）

### 表示件数
index.html 内で指定

```

renderLatestBlogPosts({
target: "#latest-records",
max: 3
});

````

---

## 🧩 blogfeed.js の役割

### extractPostContent()

Blog本文内 `.rec-card` から抽出：

- 実施日
- 山域
- ジャンル
- 感想（100字）
- 代表写真

---

## 🖼 表示構造

```html
<article class="record-card">

  <img class="record-thumb">

  <div class="record-content">

    <div class="record-header">
      <p class="record-meta">登録日</p>
      <h3 class="record-title">タイトル</h3>
    </div>

    <div class="record-info">
      <span>実施日：...</span>
      <span>山域：...</span>
      <span>ジャンル：...</span>
    </div>

    <div class="record-summary">
      感想...
    </div>

  </div>

</article>
````

---

## 🎨 レイアウト方針

* 写真左、本文右
* 登録日＋タイトル 横1行
* 実施日・山域・ジャンル 横1行
* 感想はその下
* スマホでは折り返し対応

---

## 🚀 今後の改善候補

* ローディングアニメーション改善
* キャッシュ対策
* フィルター機能追加
* ページネーション
* SEO最適化
* OGP設定
* パフォーマンス最適化

---

## 🛠 技術スタック

* HTML5
* CSS3（Flexbox）
* Vanilla JavaScript
* GitHub Pages
* Blogspot API (JSONP)

---

## 👤 Author

hiro-san

```

