# 天気予報アプリ

[OpenWeatherMap](https://openweathermap.org/) と連携した天気予報 Web アプリです。Next.js (App Router) + TypeScript で作られています。

## 機能

- 任意の**都市名検索**、または**現在地**（Geolocation）の天気を表示
- **気温 / 天気 / 体感温度 / 湿度 / 風速 / 降水確率**を表示
- **カレンダー**で日付を選ぶと、その日の予報（週間予報の中から該当日）に切り替え
- 選んだ日の **3時間ごとの詳細**（気温・降水確率）も表示
- **週間予報**（5日分）をカード表示
- API キーは**サーバー側 API ルート経由**で利用し、ブラウザには露出しません。キーは**環境変数**で管理

## 使用 API（無料枠）

- Geocoding API（都市名 → 緯度経度）
- Current Weather Data（現在の天気）
- 5 day / 3 hour Forecast（予報 → 日別に集計）

## セットアップ（ローカル）

1. OpenWeatherMap で無料登録し、API キーを取得します。
   - https://openweathermap.org/api
   - 発行直後のキーは有効化まで数時間かかる場合があります。
2. 依存関係をインストール:

```bash
npm install
```

3. 環境変数ファイルを作成:

```bash
# macOS / Linux
cp .env.example .env.local
# Windows (PowerShell)
copy .env.example .env.local
```

4. `.env.local` を開き、取得したキーを設定:

```
OPENWEATHER_API_KEY=あなたのAPIキー
```

5. 開発サーバーを起動:

```bash
npm run dev
```

http://localhost:3000 を開きます。

## 環境変数

| 変数名 | 説明 |
| --- | --- |
| `OPENWEATHER_API_KEY` | OpenWeatherMap の API キー（**必須**）。`.env.local` に設定し、コードには直書きしない。 |

`.env.local` は `.gitignore` 済みで、Git にはコミットされません。

## デプロイ（Vercel）

1. このリポジトリを GitHub に push します。
2. [Vercel](https://vercel.com/) で「New Project」からこのリポジトリを import します。
3. **Environment Variables** に `OPENWEATHER_API_KEY` を追加します（値は自分のキー）。
4. Deploy を実行します。Next.js は自動検出されます。

CLI を使う場合:

```bash
npm i -g vercel
vercel            # 初回はプロジェクト作成
vercel env add OPENWEATHER_API_KEY   # production などに追加
vercel --prod     # 本番デプロイ
```

## 技術スタック

- Next.js 15 (App Router)
- React 19 / TypeScript
- サーバー API ルート（`app/api/weather/route.ts`）で外部 API をプロキシ
- スタイルは素の CSS（`app/globals.css`）

## ディレクトリ構成

```
app/
  api/weather/route.ts   # OpenWeatherMap を叩くサーバー側エンドポイント
  layout.tsx
  page.tsx               # メイン画面（検索・現在地・カレンダー・週間予報）
  globals.css
components/
  Calendar.tsx           # 日付選択カレンダー
  WeatherIcon.tsx        # 天気アイコン
lib/
  types.ts               # 共有型定義
```
