# 📘 hiro-san 山歩きサイト V3

---

## 🧭 概要

本プロジェクトは、個人サイト「hiro-sanの山歩き」における
**山行記録の蓄積・整理・検索・再発見**を目的とした
静的サイト構築・長期運用プロジェクトである。

* 記録は Blogger に蓄積
* GitHub Pages 上に **検索・閲覧UIを構築**
* データ増加に耐える構造を最優先に設計

---

## 🏁 プロジェクトの位置づけ

本プロジェクトは以下フェーズで構成される：

* V1：初期構築
* V2：構造整理・UI統一・検索実用化（完了）
* **V3：データ基盤強化＋検索UI高度化（現行）**

👉 「作って終わり」ではなく
**記録が増え続ける前提の“育てる設計”**

---

## 🧩 システム構成（全体像）

```
Blogger（記事生成）
        ↓（JSON / JSONP）
GitHub Pages（表示・検索UI）
        ↑
records.json（統合データ）
```

---

## 📁 ディレクトリ構成（現行）

```
/hiro-san-z-reco
│
├── index.html
├── blog.html
├── about.html
├── other.html
├── records.html
├── favicon.ico
├── README.md
├── .nojekyll
│
├── CSS/
│   ├── style.css
│   ├── search.css
│   ├── SBsearch.css
│   ├── STsearch.css
│   └── other.css
│
├── JS/
│   ├── search.js
│   ├── SBsearch.js
│   ├── STsearch.js
│   ├── blogfeed.js
│   ├── blogfeed-daily.js
│   ├── include.js
│   ├── record_common.js
│   └── access-counter.js　　←　実装していない
│
├── data/
│   ├── records.json
│   ├── SBrecoords.json
│   ├── STrecords.json
│   └── 画像ファイル群
│
├── records/
│   ├── index.html
│   ├── year.html
│   ├── area.html
│   └── genre.html
│
├── parts/
│   ├── header.html
│   └── footer.html
│
├── logs/
│   ├── index.html
│   ├── SBindex.html
│   └── STindex.html
│
├── docs/
└── _archive/
```

---

## 🔍 コア機能

### ① recordsページ（正規アーカイブ）

固定軸による整理：

* 年（year）
* 山域（area）
* ジャンル（genre）

👉 **構造は固定、ロジックはJSに集約**

---

### ② searchページ（横断検索UI）

検索専用データベースUI：

* records.json ベース
* 複合条件検索

  * 年
  * 月（V3追加）
  * 山域
  * ジャンル
  * キーワード
* 並び替え
* ページング
* スマホ対応

👉 「一覧ページ」ではなく
👉 **“探すためのUI”**

---

### ③ blog連携（最新記事）

* Bloggerフィードから取得
* JSONPで安全に取得
* `.rec-card` から情報抽出

抽出内容：

* 実施日
* 山域
* ジャンル
* 感想
* 代表画像

---

## ⚙ 技術スタック

* HTML5
* CSS3（Flexbox / 変数設計）
* Vanilla JavaScript
* GitHub Pages（完全静的）
* Blogger API（JSON / JSONP）

---

## 🧠 設計思想（最重要）

### 1. 記録は増える前提

→ 初期設計でスケールを考慮

### 2. HTMLは固定

→ 変更はCSS / JSで吸収

### 3. ロジックは分離

→ UI / データ / 処理を明確分離

### 4. 原因分離主義

→ 表示崩れは場当たり対応しない

### 5. 未来の自分が読める設計

→ コメント・README重視

---

## 🎨 UI / デザイン方針

* 主役：文章
* 写真：補助
* 軽量・高速
* 色で機能分離

### カラールール

| 機能   | 色   |
| ---- | --- |
| 通常検索 | 緑   |
| SB検索 | 青   |
| ST検索 | 別系統 |

---

## 🧩 JavaScript構成

### search系

* `search.js`：通常検索
* `SBsearch.js`：Silverboy検索
* `STsearch.js`：別系統検索

### 共通

* `record_common.js`：共通処理
* `include.js`：ヘッダー・フッター・ナビ制御

### データ取得

* `blogfeed.js`
* `blogfeed-daily.js`

---

## 📊 データ設計

### records.json

統合フォーマット：

```json
{
  "date": "2025-12-15",
  "year": 2025,
  "month": 12,
  "area": "丹沢",
  "genre": "沢登り",
  "title": "...",
  "summary": "...",
  "image": "...",
  "url": "..."
}
```

👉 **検索はすべてこのJSONで完結**

---

## 🏁 現在の到達点

* 山行記録：実運用可能
* 検索：実用レベル到達
* スマホ対応：安定
* HTML手修正：ほぼ不要

👉 **「使い続けられる基盤」完成**

---

## 🚀 V3での強化ポイント

* 月検索の正式対応
* JSON構造の最適化
* JSの責務分離
* パフォーマンス改善
* UIの一貫性強化

---

## ⚠ 現在の課題（重要）

* 月検索の抽出不具合（ロジック要確認）
* JSONデータ整合性
* JS依存度の増加

👉 **V3の主戦場はここ**

---

## 🛠 今後の拡張候補

* タグ検索
* 高速化（遅延読み込み）
* オフライン対応
* SEO / OGP
* UIアニメーション

---

## 🏔 総括

V2で：

* 構造整理 ✔
* UI統一 ✔
* 検索実用化 ✔

V3では：

👉 **データ × 検索の完成度を上げるフェーズ**

---

## 👤 Author

hiro-san

---

## 📝 補足

本READMEは：

* 設計書
* 運用ガイド
* 思考ログ

を兼ねる。

👉 **未来の自分が迷わないためのドキュメント**

---

# 🔥 コメント（重要）

かなり良い状態です。正直に言うと👇

* もう「個人サイト」ではなく **軽量データベースアプリ**
* 設計思想がブレてないのが強い
* V3は“仕上げフェーズ”に入ってる

---


