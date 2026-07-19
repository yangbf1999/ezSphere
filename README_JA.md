<div align="center">

# ezSphere

### Claude Code、Codex、Hermes Agent のオールインワン管理ツール

[![Version](https://img.shields.io/github/v/release/yangbf1999/ezsphere?color=blue&label=version)](https://github.com/yangbf1999/ezsphere/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/yangbf1999/ezsphere/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![Downloads](https://img.shields.io/github/downloads/yangbf1999/ezsphere/total)](https://github.com/yangbf1999/ezsphere/releases/latest)


### 🌐 唯一の公式サイト：**https://github.com/yangbf1999/ezsphere**

[English](README.md) | [中文](README_ZH.md) | 日本語 | [Deutsch](README_DE.md) | [Changelog](CHANGELOG.md)

</div>

## ezSphere を選ぶ理由

Vibe Coding（人間とAIの協調プログラミング）は、もはや不可逆的なトレンドです。
Claude Code、Codex、Hermes は世界的に最も強力なコーディングツールとして認識され、
ソフトウェア開発の働き方を根本から変えています。
しかし、これら3つのツールは中国市場で大きな障壁に直面しています：

- **ネットワーク障壁**：一部のツールは海外サービスへのアクセスが必要で、キャンパスや企業ネットワークでは制限される
- **アカウント障壁**：いずれも海外クレジットカードまたはエンタープライズSSOが必要で、国内の学生や教員が個別に開通するのは困難
- **環境障壁**：インストールとデプロイのプロセスが複雑で、Node.js、Python、Docker などの長い依存関係チェーンがあり、
完全な設定に1〜3日を要することも珍しくない

**CC-Switch** は、AIコーディングツールの統合設定管理を先駆けて実現しました —
Claude Code、Codex、Hermes のプロバイダ切り替え、APIキー管理、
プロキシルーティング、設定同期をサポートし、瞬く間に多くの開発者にとって不可欠なツールとなりました。
しかし CC-Switch は「設定」という一環のみを解決していました。より大きな課題 —
インストール、デプロイ、修復 — は未解決のままです。
新入社員のオンボーディング、新学期の実験室、マシン交換 — 環境構築のたびに、
ツールを1つずつダウンロードし、依存関係をインストールし、環境変数を設定し、
ネットワーク問題をデバッグし、バージョン競合を解決しなければなりません...
2〜3日が過ぎ去り、業務や授業はまだ始まっていません。

この全プロセスを「数日」から「数分」に短縮するために、私たちは ezSphere を開発しました —
CC-Switch をベースに深い二次開発を行い、以下の3つを重点的に実現しました：

1. **UI/UX の全面刷新** — CC-Switch の開発者向けCLIスタイルから脱却し、
教員、学生、運用スタッフ、一般ユーザー向けに再設計。
「開発者専用ツール」から「誰でも使えるデスクトップアプリ」へ進化。
2. **Vibe Coding ツールのワンクリックインストール** — Claude Code、Codex、Hermes 向けの
AI自動インストールエンジンを内蔵。環境検出、依存関係の取得、バージョン検証を完全自動化。
経験ゼロの学生や教員でも5分で完全なAIコーディング環境を構築可能。
3. **対話型AIインストール＆修復アシスタント** — 環境異常が発生しても、
ドキュメントやログ、Stack Overflow を調べる必要はありません。
ezSphere 内で自然言語で質問するだけで、AIアシスタントが自動診断し、
修正案を提示して実行。従来1〜2日かかっていたトラブルシューティングを
コーヒーブレイク1杯分の時間に短縮します。

簡単に言えば、CC-Switch はAIツールを「使える」ようにし、ezSphere はAIコーディングを
「インストールしやすく、使いやすく、修理しやすい」ものにします。
私たちは CC-Switch という巨人の肩の上に立ち、Vibe Coding のラストマイルを
世界中の企業と大学でつなぎます。

**ezSphere** は、対応する AI ツールを 1 つのデスクトップアプリで一元管理できます。設定ファイルを手作業で編集する代わりに、ワンクリックでプロバイダをインポートし、瞬時に切り替えられるビジュアルインターフェースを提供します。国内主要プロバイダのプリセット、統一 MCP・Skills 管理、システムトレイからの即時切り替え機能を搭載。すべてはアトミック書き込みによる信頼性の高い SQLite データベースに支えられており、設定の破損を防ぎます。

- **1 つのアプリで 3 つのツール** -- Claude Code、Codex、Hermes を単一インターフェースで管理
- **手動編集は不要** -- DeepSeek、Doubao、Zhipu GLM、Kimi など国内主要プロバイダのプリセットを内蔵。選んで切り替えるだけ
- **統一 MCP・Skills 管理** -- 1 つのパネルで Claude、Codex、Hermes の MCP サーバーと Skills を双方向同期で管理
- **システムトレイでクイック切り替え** -- トレイメニューから即座にプロバイダを切り替え。アプリを開く必要なし
- **クラウド同期** -- Dropbox、OneDrive、iCloud、または WebDAV サーバー経由でデバイス間のプロバイダデータを同期
- **クロスプラットフォーム** -- Tauri 2 で構築された Windows、macOS 対応のネイティブデスクトップアプリ
- **便利ツール内蔵** -- 初回起動時のログイン確認、署名バイパス、プラグイン拡張の同期など、さまざまなユーティリティを搭載

## スクリーンショット

![ezSphere](assets/screenshots/ezsphere.png)

## 特長

[完全な更新履歴](CHANGELOG.md)

### プロバイダ管理

- **3 つの対応ツール** -- Claude Code、Codex、Hermes。キーをコピーしてワンクリックでインポート
- **ユニバーサルプロバイダ** -- 1 つの設定を Claude Code、Codex、Hermes に同期
- ワンクリック切り替え、システムトレイクイックアクセス、ドラッグ＆ドロップ並び替え、インポート/エクスポート

### ツールのインストールと修復

- **AI 自動インストール** — Claude Code、Codex、Hermes をワンクリックでインストール、自動バージョン検出と依存関係解決
- **インテリジェント修復** — インストール失敗時、内蔵 Agent が自動的に原因を診断して修復、手動でのトラブルシューティングは不要
- **バージョン管理** — 現在のバージョンを検出、更新を確認、最新バージョンにワンクリックアップグレード

### プロキシ & フェイルオーバー

- **ローカルプロキシのホットスイッチ** -- フォーマット変換、自動フェイルオーバー、サーキットブレーカー、プロバイダヘルスモニタリング、リクエストレクティファイア
- **アプリレベルのテイクオーバー** -- Claude、Codex を個別にプロキシ経由でルーティング、プロバイダ単位で設定可能

### MCP、Prompts & Skills

- **統一 MCP パネル** -- Claude、Codex、Hermes の MCP サーバーを管理
- **Prompts** -- Markdown エディタ、クロスアプリ同期（CLAUDE.md / AGENTS.md）、バックフィル保護
- **Skills** -- GitHub リポジトリまたは ZIP ファイルからワンクリックインストール、カスタムリポジトリ管理、シンボリックリンクとファイルコピーに対応

### 使用量 & コストトラッキング

- **使用量ダッシュボード** -- プロバイダ横断で支出・リクエスト数・トークン使用量を追跡、トレンドチャート、詳細リクエストログ、カスタムモデル価格設定

### Session Manager & ワークスペース

- 対応するセッションソースの会話履歴を閲覧・検索・復元

### システム & プラットフォーム

- **クラウド同期** -- カスタム設定ディレクトリ（Dropbox、OneDrive、iCloud、NAS）、WebDAV サーバーおよび S3 互換ストレージ同期
- ダーク / ライト / システムテーマ、自動起動、自動アップデーター、アトミック書き込み、自動バックアップ、多言語対応（簡体中文/繁體中文/英/日）

## よくある質問

<details>
<summary><strong>ezSphere はどの AI ツールに対応していますか？</strong></summary>

ezSphere は現在、以下の **3 つ** の AI コーディングツールをサポートしています：

| ツール | 概要 |
|---|---|
| **Claude Code** | Anthropic の AI コーディング CLI — 再起動不要のプロバイダホットスイッチに対応 |
| **Codex** | OpenAI の AI コーディングエージェント — 複数の公式アカウント（Plus/Team）間切り替えに対応 |
| **Hermes** | オープンソースの AI エージェントランナー — 複数のモデルバックエンドをサポート |

各ツールに専用のプロバイダプリセット、MCP/Skills 管理、設定同期が備わっています。
</details>

<details>
<summary><strong>プロバイダを切り替えた後、ターミナルの再起動は必要ですか？</strong></summary>

ほとんどのツールでは、はい。変更を反映するにはターミナルまたは CLI ツールを再起動してください。ただし **Claude Code** は例外で、現在プロバイダデータのホットスイッチに対応しており、再起動は不要です。

</details>

<details>
<summary><strong>プロバイダを切り替えた後、プラグイン設定が消えてしまいました。どうすればよいですか？</strong></summary>

ezSphere には「共有設定スニペット」機能があり、APIキーやエンドポイント以外の共通データをプロバイダ間で引き継ぐことができます。「プロバイダ編集」→「共有設定パネル」→「現在のプロバイダから抽出」をクリックして、すべての共通データを保存してください。新しいプロバイダを作成する際に「共有設定を書き込む」にチェック（デフォルトで有効）を入れれば、プラグインなどのデータが新しいプロバイダ設定に含まれます。すべての設定項目は、アプリ初回起動時にインポートされたデフォルトプロバイダに保存されており、失われることはありません。

</details>

<details>
<summary><strong>macOS のインストールについて</strong></summary>
> **Note**: If you see "ezSphere cannot be opened because the developer cannot be verified", run:
> ```bash
> sudo xattr -r -d com.apple.quarantine /Applications/ezSphere.app/
> ```
</details>

<details>
<summary><strong>現在アクティブなプロバイダを削除できないのはなぜですか？</strong></summary>

ezSphere は「最小限の介入」という設計原則に従っています。アプリをアンインストールしても、CLI ツールは正常に動作し続けます。すべての設定を削除すると対応する CLI ツールが使用できなくなるため、システムは常にアクティブな設定を 1 つ保持します。特定の CLI ツールをあまり使用しない場合は、設定で非表示にできます。公式ログインに戻す方法は、次の質問をご覧ください。

</details>

<details>
<summary><strong>公式ログインに戻すにはどうすればよいですか？</strong></summary>

プリセットリストから公式プロバイダを追加してください。切り替え後、ログアウト／ログインのフローを実行すれば、以降は公式プロバイダとサードパーティプロバイダを自由に切り替えられます。Codex では異なる公式プロバイダ間の切り替えに対応しており、複数の Plus アカウントや Team アカウントの切り替えに便利です。

</details>

<details>
<summary><strong>macOS インストール</strong></summary>

上記の[ダウンロード & インストール](#ダウンロード--インストール)セクションからDMGをダウンロードしてください。

1. `.dmg` ファイルを開き、ezSphere を Applications にドラッグ
2. 「開発元を確認できません」と表示された場合：

```bash
sudo xattr -r -d com.apple.quarantine /Applications/ezSphere.app/
```

3. Applications または Spotlight から ezSphere を起動

</details>

<details>
<summary><strong>データはどこに保存されますか？</strong></summary>

- **データベース**: `~/.ezsphere/ezsphere.db`（SQLite -- プロバイダ、MCP、Prompts、Skills）
- **ローカル設定**: `~/.ezsphere/settings.json`（デバイスレベルの UI 設定）
- **バックアップ**: `~/.ezsphere/backups/`（自動ローテーション、最新 10 件を保持）
- **Skills**: `~/.ezsphere/skills/`（デフォルトでシンボリックリンクにより対応アプリに接続）
- **Skill バックアップ**: `~/.ezsphere/skill-backups/`（アンインストール前に自動作成、最新 20 件を保持）

</details>

## クイックスタート

### 基本的な使い方

1. **プロバイダ追加**: 「Add Provider」をクリック → プリセットを選ぶかカスタム設定を作成
2. **プロバイダ切り替え**:
   - メイン UI: プロバイダを選択 → 「Enable」をクリック
   - システムトレイ: プロバイダ名をクリック（即時反映）
3. **反映**: ターミナルまたは対応する CLI ツールを再起動して適用（Claude Code は再起動不要）
4. **公式設定に戻す**: 「Official Login」プリセットを追加し、CLI ツールを再起動してログイン/OAuth フローを実行

### MCP、Prompts、Skills & Sessions

- **MCP**: 「MCP」ボタンをクリック → テンプレートまたはカスタム設定でサーバーを追加 → アプリごとの同期をトグルで切り替え
- **Prompts**: 「Prompts」をクリック → Markdown エディタでプリセットを作成 → 有効化してライブファイルに同期
- **Skills**: 「Skills」をクリック → GitHub リポジトリを閲覧 → 対応アプリへワンクリックでインストール
- **Sessions**: 「Sessions」をクリック → 対応するセッションソースの会話履歴を閲覧・検索・復元

> **補足**: 初回起動時に、既存の CLI ツール設定を手動でインポートしてデフォルトプロバイダとして使用できます。

## ダウンロード & インストール

### システム要件

- **Windows**: Windows 10 以上
- **macOS**: macOS 12 (Monterey) 以上

### Windows ユーザー

最新のインストーラをダウンロード：

- `ezSphere_1.0.0_x64-setup.exe` — [ダウンロード](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_x64-setup.exe)
- `ezSphere_1.0.0_x64_en-US.msi` — [ダウンロード](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_x64_en-US.msi)

### macOS ユーザー

最新のDMGをダウンロード：

- `ezSphere_1.0.0_aarch64.dmg` (Apple Silicon) — [ダウンロード](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_aarch64.dmg)
- `ezSphere_1.0.0_x86_64.dmg` (Intel) — [ダウンロード](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_x86_64.dmg)

> **注意**：「開発元を確認できません」と表示された場合：
> ```bash
> sudo xattr -r -d com.apple.quarantine /Applications/ezSphere.app/
> ```


<details>
<summary><strong>アーキテクチャ概要</strong></summary>

### 設計原則

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TS)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Components  │  │    Hooks     │  │  TanStack Query  │    │
│  │   (UI)      │──│ (Bus. Logic) │──│   (Cache/Sync)   │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ Tauri IPC
┌────────────────────────▼────────────────────────────────────┐
│                  Backend (Tauri + Rust)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Commands   │  │   Services   │  │  Models/Config   │    │
│  │ (API Layer) │──│ (Bus. Layer) │──│     (Data)       │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**コア設計パターン**

- **SSOT** (Single Source of Truth): すべてのデータを `~/.ezsphere/ezsphere.db`（SQLite）に集約
- **二層ストレージ**: 同期データは SQLite、デバイスデータは JSON
- **双方向同期**: 切り替え時はライブファイルへ書き込み、編集時はアクティブプロバイダから逆同期
- **アトミック書き込み**: 一時ファイル + rename パターンで設定破損を防止
- **並行安全**: Mutex で保護された DB 接続でレースコンディションを防止
- **レイヤードアーキテクチャ**: Commands → Services → DAO → Database を明確に分離

**主要コンポーネント**

- **ProviderService**: プロバイダの CRUD、切り替え、バックフィル、ソート
- **McpService**: MCP サーバー管理、インポート/エクスポート、ライブファイル同期
- **ProxyService**: ローカル Proxy モードのホットスイッチとフォーマット変換
- **SessionManager**: 対応する全アプリの会話履歴閲覧
- **ConfigService**: 設定のインポート/エクスポート、バックアップローテーション
- **SpeedtestService**: API エンドポイントの遅延計測

</details>

<details>
<summary><strong>開発ガイド</strong></summary>

### 開発環境

- Node.js 18+
- pnpm 8+
- Rust 1.85+
- Tauri CLI 2.8+

### 開発コマンド

```bash
# 依存関係をインストール
pnpm install

# 開発モード（ホットリロード）
pnpm tauri dev

# フロントエンド開発サーバーのみ起動
pnpm dev:renderer

# フロントエンドのみビルド
pnpm build:renderer

# 型チェック
pnpm typecheck

# コードフォーマット
pnpm format

# フォーマットチェック
pnpm format:check

# フロントエンド単体テスト実行
pnpm test:unit

# ウォッチモード（変更時に自動再実行）
pnpm test:unit:watch

# アプリケーションをビルド（本番）
pnpm build

# デバッグ版をビルド
pnpm tauri build --debug
```

### Rust バックエンド開発

```bash
cd src-tauri

# Rust コードをフォーマット
cargo fmt

# clippy チェックを実行
cargo clippy

# すべてのバックエンドテストを実行
cargo test --lib

# 特定のテストを実行
cargo test test_name

# テストフック有効で実行（CI用）
cargo test --features test-hooks

# デバッグ版を直接ビルド
cargo build
```

### テストガイド

**フロントエンドテスト**：

- テストフレームワーク **vitest** を使用
- **MSW (Mock Service Worker)** で Tauri API をモック
- **@testing-library/react** / **@testing-library/user-event** でコンポーネントテスト

**テストの実行**：

```bash
# 全テストを実行
pnpm test:unit

# ウォッチモード（変更時自動再実行）
pnpm test:unit:watch

# カバレッジレポート付き
pnpm test:unit --coverage
```


### 技術スタック

**フロントエンド**: React 18 · TypeScript · Vite · TailwindCSS 3.4 · TanStack Query v5 · react-i18next · react-hook-form · zod · shadcn/ui · @dnd-kit · lucide-react

**バックエンド**: Tauri 2.8 · Rust · serde · tokio · reqwest · thiserror · tauri-plugin-updater/process/dialog/store/log/deep-link/window-state/single-instance

**テスト**: vitest · MSW · @testing-library/react · @testing-library/user-event
</details>

<details>
<summary><strong>プロジェクト構成</strong></summary>

```
├── src/                          # Frontend (React + TypeScript)
│   ├── api/                      # Tauri IPC wrappers
│   ├── assets/                   # Static assets (fonts, icons)
│   ├── components/               # UI components
│   │   ├── agents/               # Agent prompt editor
│   │   ├── chat/                 # Chat UI components
│   │   ├── common/               # Shared UI components
│   │   ├── deeplink/             # Deep Link import UI
│   │   ├── env/                  # Environment variable editor
│   │   ├── hermes/               # Hermes config panels
│   │   ├── icons/                # Provider icon components
│   │   ├── mcp/                  # MCP management UI
│   │   ├── models/               # Model center
│   │   ├── prompts/              # Prompts management UI
│   │   ├── providers/            # Provider list/card/form
│   │   ├── proxy/                # Proxy & failover UI
│   │   ├── sessions/             # Session manager UI
│   │   ├── settings/             # Settings panels
│   │   ├── skills/               # Skills management UI
│   │   ├── ui/                   # shadcn/ui component library
│   │   ├── universal/            # Universal provider UI
│   │   ├── usage/                # Usage dashboard UI
│   │   └── workspace/            # Workspace editor UI
│   ├── config/                   # Preset configs (providers/mcp/prompts)
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom React hooks
│   ├── i18n/                     # Translations (locales)
│   ├── icons/                    # Extracted SVG icons
│   ├── layouts/                  # Shell/app layouts
│   ├── lib/                      # Core library
│   │   ├── api/                  # Type-safe API wrapper
│   │   ├── errors/               # Error utilities
│   │   ├── query/                # TanStack Query setup
│   │   ├── schemas/              # Form validation schemas
│   │   └── utils/                # UI utilities (cn, etc.)
│   ├── pages/                    # Page-level components
│   ├── stores/                   # Zustand stores
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Helper utilities
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── commands/             # Tauri command layer (by domain)
│   │   ├── database/             # SQLite schema + DAO
│   │   │   └── dao/              # Data access objects
│   │   ├── deeplink/             # Deep Link parsing/handling
│   │   ├── deployment/           # AI install & repair (Agent chain)
│   │   ├── mcp/                  # MCP sync modules (per-app)
│   │   ├── proxy/                # Local proxy engine
│   │   │   ├── providers/        # Protocol converters (per-app)
│   │   │   └── usage/            # Usage tracking middleware
│   │   ├── resources/            # Bundled resources
│   │   ├── services/             # Business logic layer
│   │   │   ├── provider/         # Provider CRUD, live config
│   │   │   └── webdav_sync/      # WebDAV cloud sync
│   │   └── session_manager/      # Session history browsing
│   ├── tests/                    # Backend integration tests
│   └── Cargo.toml                # Rust dependencies
├── tests/                        # Frontend unit tests
├── assets/                       # Screenshots & partner banners
│   └── screenshots/              # Product screenshots
├── docs/                         # Documentation (api/ bundled assets)
├── flatpak/                      # Flatpak packaging config
├── scripts/                      # Build/release scripts
└── *.json / *.ts / *.cjs         # Config files (package, vite, tailwind, tsconfig)
```

</details>

## 貢献

Issue や提案を歓迎します！

PR を送る前に以下をご確認ください：

- 型チェック: `pnpm typecheck`
- フォーマットチェック: `pnpm format:check`
- 単体テスト: `pnpm test:unit`

新機能の場合は、PR を送る前に Issue でディスカッションしてください。プロジェクトに合わない機能の PR はクローズされる場合があります。

## 謝辞

ezSphere は以下の優れたオープンソースプロジェクトの成果の上に成り立っています：

- **[CC-Switch 3.16.4](https://github.com/farion1231/CC-Switch)**（MIT）- 設定オーケストレーションホスト、プロバイダ/プロキシ/データベース基盤

これらのプロジェクトの作者とコントリビュータに心より感謝いたします！🙏

## ライセンス

MIT © Jason Young
