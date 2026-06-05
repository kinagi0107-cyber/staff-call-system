# スタッフコール - QRコード呼び出しシステム

QRコードをスキャンしてスタッフを呼び出すシステムです。顧客がQRコードをスキャンして場所名を入力すると、スタッフダッシュボードにリアルタイムで通知が届きます。

## 機能

- **QRコード生成**: 管理者が新しいQRコードを作成
- **顧客用インターフェース**: QRコードをスキャンして場所名を入力
- **スタッフダッシュボード**: リアルタイムで呼び出し一覧を表示
- **ステータス管理**: 呼び出しを「待機中」「対応済み」に変更
- **リアルタイム通知**: Server-Sent Events (SSE) で自動更新

## 技術スタック

- **バックエンド**: Express.js, TypeScript, SQLite
- **フロントエンド**: React, Babel (CDN)
- **QRコード**: qrcode.js, jsQR
- **リアルタイム通信**: Server-Sent Events (SSE)

## インストール

```bash
npm install
```

## 開発環境での実行

```bash
npm run dev:simple
```

サーバーは `http://localhost:3000` で起動します。

## ビルド

```bash
npm run build
```

## 本番環境での実行

```bash
npm start
```

## Render へのデプロイ

### 1. GitHub にプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/staff-call-system.git
git push -u origin main
```

### 2. Render で新しいサービスを作成

1. [Render](https://render.com) にアクセス
2. 「New +」 → 「Web Service」
3. GitHub リポジトリを接続
4. 以下の設定を入力:
   - **Name**: staff-call-system
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. 「Create Web Service」をクリック

### 3. デプロイ完了

Render が自動的にビルドとデプロイを実行します。完了後、提供されたURLでアプリケーションにアクセスできます。

## API エンドポイント

### QRコード管理

- `GET /api/qr-codes` - すべてのQRコードを取得
- `POST /api/qr-codes` - 新しいQRコードを作成
- `GET /api/qr-codes/:id` - 特定のQRコードを取得

### 呼び出し管理

- `GET /api/calls` - すべての呼び出しを取得
- `POST /api/calls` - 新しい呼び出しを作成
- `PATCH /api/calls/:id` - 呼び出しのステータスを更新
- `DELETE /api/calls` - すべての呼び出しを削除

### リアルタイム更新

- `GET /api/events` - Server-Sent Events ストリーム

## ディレクトリ構造

```
.
├── server.ts          # Express サーバー
├── db.ts              # SQLite データベース
├── public/
│   └── index.html     # フロントエンド (React)
├── package.json
├── tsconfig.json
├── README.md
└── staff_calls.db     # SQLite データベースファイル (自動作成)
```

## ライセンス

MIT
