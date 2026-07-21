<div align="center">

# ezSphere

### Claude Code、Codex、Hermes 和 Agent 的全方位管理工具

[![Version](https://img.shields.io/github/v/release/yangbf1999/ezsphere?color=blue&label=version)](https://github.com/yangbf1999/ezsphere/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/yangbf1999/ezsphere/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![Downloads](https://img.shields.io/github/downloads/yangbf1999/ezsphere/total)](https://github.com/yangbf1999/ezsphere/releases/latest)


### 🌐 唯一官方网站：**https://github.com/yangbf1999/ezsphere**

[English](README.md) | 中文 | [日本語](README_JA.md) | [Deutsch](README_DE.md) | [更新日志](CHANGELOG.md)

</div>

## 为什么选择 ezSphere？

毫无疑问，Vibe Coding（人机协作编程）已成为不可逆转的潮流。
Claude Code、Codex、Hermes 已成为全球公认的最强编程工具，
彻底重塑了软件研发的工作方式。
然而，这三款工具在中国市场普遍面临"水土不服"：

网络门槛：部分工具需访问海外服务，校园网/政企网环境受限；
账号门槛：均需海外信用卡或企业 SSO，国内师生难以独立开通；
环境门槛：安装部署流程复杂，Node.js、Python、Docker 等依赖链冗长，
一次完整配置动辄 1-3 天，排查各种报错消耗大量精力。

CC-Switch 的出现，率先解决了 AI 编程工具的统一配置管理问题——
支持 Claude Code、Codex、Hermes 等多工具的供应商切换、API Key 管理、
代理路由与配置同步，迅速成为众多研发人员的"装机必备"。
但 CC-Switch 只解决了"配置"这一环，更大的痛点其实在"安装、部署、修复"：
新员工入职、新生开课、实验室换机，每一次环境搭建都意味着——
逐个下载工具、安装依赖、配置环境变量、排查网络问题、处理版本冲突——
两三天过去了，业务/课程却还没正式开始。
为了将这一全流程从"几天"压缩到"几分钟"，我们推出 ezSphere——
在 CC-Switch 基础上深度二次开发，重点补齐三件事：

1. UI/UX 全面重构——彻底告别 CC-Switch 偏极客的命令行风格，
面向教师、学生、运营、行政等不同人群重新设计交互，
从"研发专用工具"进化为"人人可用的桌面应用"。
2. Vibe Coding 工具一键安装——内置 Claude Code、Codex、Hermes 等主流
Vibe Coding 工具的 AI 自动安装引擎，环境检测、依赖拉取、版本校验全自动完成，
学生/教师零基础也能 5 分钟拥有完整的 AI 编程环境。
3. 对话式 AI 安装与修复助手——遇到环境异常时，无需翻文档、查日志、搜 Stack Overflow，
直接在 ezSphere 内用自然语言提问，AI 助手自动诊断、给出修复方案并执行，
把传统 1-2 天的排障压缩到一杯咖啡的时间。
简单说：CC-Switch 让 AI 工具"能用"，ezSphere 让 AI 编程"好用、易装、易修"。
我们站在 CC-Switch 这位巨人的肩膀上，把 Vibe Coding 在中国高校与企业的最后一公里
彻底打通。

**ezSphere** 为你提供一个桌面应用来管理所有支持的 AI 工具。无需手动编辑配置文件，你将获得一个可视化界面，一键将供应商导入应用，一键在不同的供应商之间进行切换，内置国内主流供应商预设、统一的 MCP, SKILLS 管理以及系统托盘即时切换功能——所有操作都基于可靠的 SQLite 数据库和原子写入机制，保护你的配置不被损坏。

- **一个应用，三个工具** — 在单一界面中管理 Claude Code、Codex、Hermes
- **告别手动编辑** — 国内主流供应商预设，包括 DeepSeek、豆包、智谱 GLM、Kimi 等；一键即可切换
- **统一 MCP, SKILLS 管理** — 一个面板管理 Claude、Codex 和 Hermes 的 MCP, SKILLS
- **系统托盘快速切换** — 从托盘菜单即时切换供应商，无需打开完整应用
- **云同步** — 通过 Dropbox、OneDrive、iCloud 或 WebDAV 服务器在不同设备之间同步供应商数据
- **跨平台** — 基于 Tauri 2 构建的原生桌面应用，支持 Windows 和 macOS
- **小工具** - 内置了多种小工具来解决首次安装登录确认、禁止签名、插件拓展同步等多种功能

## 界面预览

![ezSphere](assets/screenshots/ezsphere.png)

## 功能特性

[完整更新日志](CHANGELOG.md)

### 供应商管理

- **3 个支持工具** — Claude Code、Codex、Hermes；复制 key 即可一键导入
- **通用供应商** — 一份配置同步到 Claude Code、Codex 和 Hermes
- 一键切换、系统托盘快速访问、拖拽排序、导入导出

### 工具安装与修复

- **AI 自动安装** — 一键安装 Claude Code、Codex、Hermes，自动检测版本和依赖
- **智能修复** — 安装失败时，内置 Agent 自动诊断原因并修复，无需手动排查
- **版本管理** — 检测当前版本，检查更新，一键升级到最新版本

### 代理与故障转移

- **本地代理热切换** — 格式转换、自动故障转移、熔断器、供应商健康监控和整流器
- **应用级代理接管** — 独立为 Claude、Codex 配置代理，具体到单个供应商

### MCP、Prompts 与 Skills

- **统一 MCP 面板** — 管理 Claude、Codex 和 Hermes 的 MCP 服务器
- **Prompts** — Markdown 编辑器，跨应用同步（CLAUDE.md / AGENTS.md），回填保护
- **Skills** — 从 GitHub 仓库或 ZIP 文件一键安装，自定义仓库管理，支持软连接和文件复制

### 用量与成本追踪

- **用量仪表盘** — 跨供应商追踪支出、请求数和 Token 用量，趋势图表、详细请求日志和自定义模型定价

### 会话管理器与工作区

- 浏览、搜索和恢复支持的会话来源

### 系统与平台

- **云同步** — 自定义配置目录（Dropbox、OneDrive、iCloud、坚果云、NAS）、WebDAV 及 S3 兼容存储同步
- 深色 / 浅色 / 跟随系统主题、开机自启、自动更新、原子写入、自动备份、国际化（简中/繁中/英/日）

## 常见问题

<details>
<summary><strong>ezSphere 支持哪些 AI 工具？</strong></summary>

ezSphere 目前支持以下 **三款** AI 编程工具：

| 工具 | 简介 |
|---|---|
| **Claude Code** | Anthropic 的 AI 编程 CLI — 支持供应商热切换，无需重启 |
| **Codex** | OpenAI 的 AI 编程代理 — 支持多个官方账号（Plus/Team）间切换 |
| **Hermes** | 开源 AI 代理运行器 — 支持多种模型后端 |

每个工具都有专属供应商预设、MCP/Skills 管理和配置同步。
</details>

<details>
<summary><strong>切换供应商后需要重启终端吗？</strong></summary>

大多数工具需要重启终端或 CLI 工具才能使更改生效。例外的是 **Claude Code**，它目前支持供应商数据的热切换，无需重启。

</details>

<details>
<summary><strong>切换供应商之后我的插件配置怎么不见了？</strong></summary>

ezSphere 使用“通用配置片段”功能，在不同的供应商之间传递 Key 和请求地址之外的通用数据，您可以在“编辑供应商”菜单的“通用配置面板”里，点击“从当前供应商提取”，把所有的通用数据提取到通用配置中，之后在新建“供应商”的时候，只要勾选“写入通用配置”（默认勾选），就会把插件等数据写入到新的供应商配置中。您的所有配置项都会保存在运行本软件的时候，第一次导入的默认供应商里面，不会丢失。

</details>

<details>
<summary><strong>macOS 安装</strong></summary>

从上方的[下载安装](#下载安装)部分下载 DMG 文件。

1. 打开 `.dmg` 文件，将 ezSphere 拖入 Applications
2. 如果提示"无法验证开发者"，请运行：

```bash
sudo xattr -r -d com.apple.quarantine /Applications/ezSphere.app/
```

3. 从 Applications 或 Spotlight 启动 ezSphere

</details>

<details>
<summary><strong>为什么总有一个正在激活中的供应商无法删除？</strong></summary>

本软件的设计原则是“最小侵入性”，即使卸载本软件，也不会影响应用的正常使用。

所以系统总会保留一个正在激活中的配置，因为如果将所有配置全部删除，该应用将无法正常使用。如果你不经常使用某个对应的应用，可以在设置中关掉该应用的显示。如果你想切换回官方登录，可以参考下条。

</details>

<details>
<summary><strong>如何切换回官方登录？</strong></summary>

可以在预设供应商里面添加一个官方供应商。切换过去之后，执行一遍 Log out / Log in 流程，之后便可以在官方供应商和第三方供应商之间随意切换。CodeX 可以在不同官方供应商之间进行切换，方便多个 Plus 或者 Team 账号之间切换。

</details>

<details>
<summary><strong>我的数据存储在哪里？</strong></summary>

- **数据库**：`~/.ezsphere/ezsphere.db`（SQLite — 供应商、MCP、提示词、技能）
- **本地设置**：`~/.ezsphere/settings.json`（设备级 UI 偏好设置）
- **备份**：`~/.ezsphere/backups/`（自动轮换，保留最近 10 个）
- **SKILLS**：`~/.ezsphere/skills/`（默认通过软链接连接到对应应用）
- **技能备份**：`~/.ezsphere/skill-backups/`（卸载前自动创建，保留最近 20 个）

</details>

## 快速开始

### 基本使用

1. **添加供应商**：进入"模型中心"页面 -> 选择预设或创建自定义配置
2. **切换供应商**：
   - 应用管理：选择供应商 -> 点击"启用"
   - 系统托盘：直接点击供应商名称（立即生效）
3. **生效方式**：重启终端或对应的 CLI 工具以应用更改（Claude Code 无需重启）
4. **恢复官方登录**：添加"官方登录"预设，重启 CLI 工具后按照其登录/OAuth 流程操作

### MCP、Prompts、Skills 与会话

- **MCP**：进入"MCP管理"页面，点击"MCP"按钮 -> 通过模板或自定义配置添加服务器 -> 切换各应用同步开关
- **Prompts**：进入"提示词管理"页面 -> 使用 Markdown 编辑器创建预设 -> 激活后同步到 live 文件
- **Skills**：进入"技能管理"页面 -> 从本地导入技能 -> 一键安装到支持的应用
- **会话**：进入"会话管理"页面 -> 浏览、搜索和恢复支持的会话来源

> **注意**：首次启动可以手动导入现有 CLI 工具配置作为默认供应商。

## 下载安装

### 系统要求

- **Windows**：Windows 10 及以上
- **macOS**：macOS 12 (Monterey) 及以上

### Windows 用户

下载最新的安装包：

- `ezSphere_1.0.0_x64-setup.exe` — [下载](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_x64-setup.exe)
- `ezSphere_1.0.0_x64_en-US.msi` — [下载](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_x64_en-US.msi)

### macOS 用户

下载最新的 DMG：

- `ezSphere_1.0.0_aarch64.dmg` (Apple Silicon) - [下载](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_aarch64.dmg)
- `ezSphere_1.0.0_x86_64.dmg` (Intel) - [下载](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_x86_64.dmg)

> **注意**：如果提示"无法验证开发者"，请运行：
> ```bash
> sudo xattr -r -d com.apple.quarantine /Applications/ezSphere.app/
> ```

<details>
<summary><strong>架构总览</strong></summary>

### 设计原则

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (React + TS)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Components  │  │    Hooks     │  │  TanStack Query  │    │
│  │   （UI）     │──│ （业务逻辑）   │──│   （缓存/同步）    │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ Tauri IPC
┌────────────────────────▼────────────────────────────────────┐
│                  后端 (Tauri + Rust)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Commands   │  │   Services   │  │  Models/Config   │    │
│  │ （API 层）   │──│  （业务层）    │──│    （数据）       │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**核心设计模式**

- **SSOT**（单一事实源）：所有数据存储在 `~/.ezsphere/ezsphere.db`（SQLite）
- **双层存储**：SQLite 存储可同步数据，JSON 存储设备级设置
- **双向同步**：切换时写入 live 文件，编辑当前供应商时从 live 回填
- **原子写入**：临时文件 + 重命名模式防止配置损坏
- **并发安全**：Mutex 保护的数据库连接避免竞态条件
- **分层架构**：清晰分离（Commands → Services → DAO → Database）

**核心组件**

- **ProviderService**：供应商增删改查、切换、回填、排序
- **McpService**：MCP 服务器管理、导入导出、live 文件同步
- **ProxyService**：本地 Proxy 模式，支持热切换和格式转换
- **SessionManager**：全应用会话历史浏览
- **ConfigService**：配置导入导出、备份轮换
- **SpeedtestService**：API 端点延迟测量

</details>

<details>
<summary><strong>开发指南</strong></summary>

### 环境要求

- Node.js 22.12+
- pnpm (最新版本)
- Rust 1.95+
- Tauri CLI 2.8+
### 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（热重载）
pnpm tauri dev

# 仅启动前端开发服务器（渲染进程）
pnpm dev:renderer

# 仅构建前端（渲染进程）
pnpm build:renderer

# 类型检查
pnpm typecheck

# 代码格式化
pnpm format

# 检查代码格式
pnpm format:check

# 运行前端单元测试
pnpm test:unit

# 监听模式（修改自动重跑）
pnpm test:unit:watch

# 构建应用（生产版）
pnpm build

# 构建调试版本
pnpm tauri build --debug
```

### Rust 后端开发

```bash
cd src-tauri

# 格式化 Rust 代码
cargo fmt

# 运行 clippy 检查
cargo clippy

# 运行全部后端单元测试
cargo test --lib

# 运行指定测试
cargo test test_name

# 运行测试 hooks（CI 中使用）
cargo test --features test-hooks

# 直接构建调试版本
cargo build
```

### 测试说明

**前端测试**：

- 使用 **vitest** 作为测试框架
- 使用 **MSW (Mock Service Worker)** 模拟 Tauri API 调用
- 使用 **@testing-library/react** / **@testing-library/user-event** 进行组件测试

**运行测试**：

```bash
# 运行所有测试
pnpm test:unit

# 监听模式（修改自动重跑）
pnpm test:unit:watch

# 带覆盖率报告
pnpm test:unit --coverage
```


### 技术栈

**前端**：React 18 · TypeScript · Vite · TailwindCSS 3.4 · TanStack Query v5 · react-i18next · react-hook-form · zod · shadcn/ui · @dnd-kit · lucide-react

**后端**：Tauri 2.8 · Rust · serde · tokio · reqwest · thiserror · tauri-plugin-updater/process/dialog/store/log/deep-link/window-state/single-instance

**测试**：vitest · MSW · @testing-library/react · @testing-library/user-event
</details>

<details>
<summary><strong>项目结构</strong></summary>

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

## 贡献

欢迎提交 Issue 反馈问题和建议！

提交 PR 前请确保：

- 通过类型检查：`pnpm typecheck`
- 通过格式检查：`pnpm format:check`
- 通过单元测试：`pnpm test:unit`

新功能开发前，欢迎先开 Issue 讨论实现方案，不适合项目的功能性 PR 有可能会被关闭。

## 致谢

ezSphere 站在以下优秀开源项目的肩膀上：

- **[CC-Switch 3.16.4](https://github.com/farion1231/CC-Switch)**（MIT）- 配置编排宿主，供应商/代理/数据库基础

衷心感谢这些项目的作者和贡献者！🙏

## License

MIT © Jason Young
