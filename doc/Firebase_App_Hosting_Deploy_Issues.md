# Firebase App Hosting デプロイエラー記録

## 概要
Firebase App Hostingへのデプロイ時に発生したエラーとその解決過程を記録します。

## エラー履歴と対処法

### 1. 初回エラー: ESM/CommonJS互換性問題

**エラー内容:**
```
Error [ERR_REQUIRE_ESM]: require() of ES Module ... not supported. 
Instead change the require of index.js ... to a dynamic import() ...
```

**原因:**
- `node-fetch`パッケージのESM/CommonJS互換性問題
- Firebase AdminのFirestoreが内部でnode-fetchを使用

**対処法:**
- `apphosting.yaml`の作成
- Node.js 20ランタイムの指定
- `firebase.json`へのApp Hosting設定追加

**結果:** 次のエラーへ進行

---

### 2. 設定ファイルフォーマットエラー

**エラー内容:**
```
"reason":"Invalid apphosting.yaml"
"userFacingMessage":"Your apphosting.yaml file at path '/workspace/apphosting.yaml' is not formatted properly."
"rawLog":"yaml: unmarshal errors: line 11: cannot unmarshal !!map into []apphostingschema.EnvironmentVariable"
```

**原因:**
- `apphosting.yaml`の環境変数セクションの書式エラー
- `env:`の直下に`NODE_ENV: production`のようなマップ形式で記述
- Firebase App Hostingでは`env:`はリスト形式が必要

**対処法:**
```yaml
# 修正前（エラー）
env:
  NODE_ENV: production

# 修正後（正しい形式）
env:
  - variable: NODE_ENV
    value: production
    availability:
      - BUILD
      - RUNTIME
```

**結果:** 次のエラーへ進行

---

### 3. npm依存関係競合エラー（1回目）

**エラー内容:**
```
npm error ERESOLVE could not resolve
While resolving: ai@3.4.33
Found: openai@5.12.2
Could not resolve dependency: peerOptional openai@"^4.42.0" from ai@3.4.33
```

**原因:**
- `ai@3.4.33`が`openai@^4.42.0`を要求
- プロジェクトでは`openai@5.12.2`を使用
- ピア依存関係の競合

**対処法（失敗）:**
- `ai`パッケージをv5.0.9に更新を試行
- しかし新たな競合が発生

---

### 4. npm依存関係競合エラー（2回目）

**エラー内容:**
```
npm error ERESOLVE could not resolve
While resolving: openai@5.12.2
Found: zod@4.0.15
Could not resolve dependency: peerOptional zod@"^3.23.8" from openai@5.12.2
```

**原因:**
- `openai@5.12.2`が`zod@^3.23.8`を要求
- プロジェクトでは`zod@4.0.15`を使用
- zodバージョンの競合

**対処法:**
1. `apphosting.yaml`でカスタムビルドステップを設定:
```yaml
build:
  buildSteps:
    - name: 'gcr.io/cloud-builders/npm'
      args: ['install', '--legacy-peer-deps']
    - name: 'gcr.io/cloud-builders/npm'
      args: ['run', 'build']
```

2. `.npmrc`ファイルの作成:
```
legacy-peer-deps=true
```

3. `ai`パッケージをv3.4.33に戻す（v5との互換性問題回避）

**結果:** ローカルビルド成功、Firebase App Hostingでのテスト待ち

---

## 学んだ教訓

### 1. Firebase App Hosting設定ファイル

**重要なポイント:**
- `apphosting.yaml`の環境変数は必ずリスト形式で記述
- Node.jsバージョンはNext.js 15に対応した20を指定
- CPU/メモリ設定は`runConfig`セクション内に記述

**推奨設定:**
```yaml
runtime: nodejs20
service: default

build:
  buildSteps:
    - name: 'gcr.io/cloud-builders/npm'
      args: ['install', '--legacy-peer-deps']
    - name: 'gcr.io/cloud-builders/npm'
      args: ['run', 'build']

env:
  - variable: NODE_ENV
    value: production
    availability:
      - BUILD
      - RUNTIME

runConfig:
  minInstances: 0
  maxInstances: 100
  cpu: 1
  memory: 1Gi
  concurrency: 100
```

### 2. npm依存関係管理

**問題:**
- AI関連パッケージ（`ai`, `openai`）の進化が速い
- バージョン間での破壊的変更が多い
- ピア依存関係の競合が頻発

**対策:**
- `.npmrc`で`legacy-peer-deps=true`を設定
- 安定版パッケージの維持（必要に応じてアップデート延期）
- Firebase App Hostingでのカスタムビルドステップ活用

### 3. バージョン管理戦略

**ai パッケージ:**
- v3系: 安定しているが古い
- v5系: 最新機能だが破壊的変更多数
- **推奨:** v3系を維持し、段階的移行を計画

**openai パッケージ:**
- v4系: `ai@3.4.33`との互換性良好
- v5系: 新機能豊富だが依存関係競合のリスク
- **推奨:** v5系を維持し、`--legacy-peer-deps`で対応

## 今後の対応

### 短期的対応
1. 現在の設定でFirebase App Hostingデプロイテスト
2. エラーが続く場合は追加調査・対応
3. ESLintエラーの段階的修正

### 中長期的対応
1. AI関連パッケージの最新版への移行計画
2. TypeScript厳格化
3. 依存関係管理の自動化検討

## 参考リンク
- [Firebase App Hosting Configuration](https://firebase.google.com/docs/app-hosting/configure)
- [npm peer dependencies](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#peerdependencies)
- [Next.js 15 compatibility](https://nextjs.org/docs/app/api-reference/next-config-js)

---

**最終更新:** 2025-08-11  
**ステータス:** 進行中（Firebase App Hostingデプロイテスト待ち）