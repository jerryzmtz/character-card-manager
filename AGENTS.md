# AGENTS.md

## 语言与沟通

- 始终使用简体中文回复用户。
- 面向用户的说明要具体、可执行，避免空泛的 AI 腔。

## Windows / PowerShell 编码规则

- 本项目默认按 UTF-8 处理中文、日文、中文路径、SillyTavern 配置、Markdown、JSON/JSONC 和浏览器自动化结果。
- 读取包含中文或日文的文件时，PowerShell 必须显式指定 UTF-8：
  `Get-Content -Raw -Encoding UTF8 -LiteralPath '路径'`。
- 如果终端输出、DOM 文本、截图复核或测试结果出现 `??`、`????`、mojibake、空方块、乱码，不允许基于这次结果判断或修改代码；必须先修复编码，再重新验证。
- 不要把包含中文文本或中文路径的脚本通过 PowerShell 管道直接传给 `node -`、Playwright、Chrome headless、CDP 或其他浏览器自动化工具。需要时先写入 UTF-8 临时 `.js` / `.mjs` 文件，执行后删除。
- 浏览器自动化和视觉检查中必须显式写入 `<meta charset="utf-8">`；移动端复现页还必须写入 `<meta name="viewport" content="width=device-width, initial-scale=1">`。

## 项目定位

- 本仓库是“角色卡管理器”的准备工程，基于 `StageDog/tavern_helper_template`。
- 目标是重造一个新的角色卡管理脚本，而不是维护或直接改写参考 JSON 脚本。
- 参考脚本位于 `参考资料/参考用脚本/角色卡管理器参考脚本.json`，默认只作为材料归档；未得到明确要求时不要读取、拆解或复制其中代码。

## 产品与设计原则

- 以 `PRODUCT.md` 和 `DESIGN.md` 为产品与视觉约束来源。
- 工具打开后应直接进入任务界面，不做落地页、欢迎页或装饰性介绍页。
- 修改、删除、导入、覆盖、批量处理等操作必须先预览方案，再由用户确认。
- 默认保守处理用户数据；读取失败、保存失败、接口不可用和低置信结果必须可见提示。
- UI 应继承世界书管理器的深色工具界面、密集信息结构、配置区加预览区节奏和移动端单列策略。

## 自动化测试要求

- 每个新增功能都必须同步制作对应的自动化测试脚本；没有测试覆盖的功能视为未完成。
- 数据读取、字段归一化、搜索、排序、筛选和风险判断优先写单元测试。
- 组件状态、错误提示、详情预览和关键交互优先写组件测试或浏览器自动化测试。
- 浏览器自动化测试必须覆盖中文 DOM 文本；若出现 `??`、`????` 或乱码，本次验证无效，必须先修复编码后重跑。
- 涉及写入、删除、覆盖、批量处理的功能，测试必须覆盖“先预览、后确认”和取消路径。

## TauriTavern / iOS 风险边界

- 不要默认安装深度请求 hook：`fetch`、`jQuery.ajax`、`XMLHttpRequest`、Tauri invoke broker 和可见流式响应体读取都可能在 iOS WKWebView / TauriTavern 中造成黑屏或时序冲突。
- 若未来需要监听宿主请求，优先寻找 TauriTavern 原生日志或轻量事件来源；深度 hook 只能作为显式排障开关，不能作为默认路径。
- “桌面浏览器正常”不能证明 iOS TauriTavern 安全；涉及宿主 API、请求监听和流式响应时必须单独标注移动端风险。

## Git 分支与发布

- `dev` 是默认开发分支，所有日常开发、修复、文档准备和模板同步都先进入 `dev`。
- `main` 是发布分支，只接受从 `dev` 或 `release/vX.YY` 合并来的可发布源码快照。
- 禁止直接在 `main` 做日常开发。
- 发布 tag 必须指向 GitHub Actions 生成的 `[bot] bundle` 提交，不能指向源码提交。
- 自动递增版本号和自动打 tag 不用于本项目；版本号和 GitHub Release 由发布流程手动确认。
- 完整发布步骤见 `RELEASE.md`。

## 常用命令

- 安装依赖：`pnpm install`
- 开发构建：`pnpm build:dev`
- 生产构建：`pnpm build`
- 监听构建：`pnpm watch`
- 代码检查：`pnpm lint`
- 单元/组件测试：`pnpm test`
- 浏览器自动化测试：`pnpm test:e2e`
- 全量验证：`pnpm test:all`

## 参考资料

- `.cursor/rules/`：酒馆助手、脚本、前端界面、MVU、角色卡相关规则。
- `初始模板/`：模板提供的可复制起点。
- `示例/`：模板示例，供开发时参考；不要因为当前项目暂未使用就随意删除。
