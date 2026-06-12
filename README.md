# 角色卡管理器

这是“角色卡管理器”的准备工程，基于 `StageDog/tavern_helper_template` 创建。

当前阶段只完成工程骨架、参考资料归档、产品/设计规范和发布流程准备；还没有实现正式的角色卡管理功能。

## 当前内容

- `src/角色卡管理器/index.ts`：空脚本入口，用于验证模板阶段能产出 `dist/角色卡管理器/index.js`。
- `参考资料/参考用脚本/角色卡管理器参考脚本.json`：旧角色卡管理器脚本归档，只作为后续参考材料。
- `PRODUCT.md`：产品定位和核心原则。
- `DESIGN.md`：视觉设计规范。
- `RELEASE.md`：`dev` / `main` 分支模型和发布流程。
- `AGENTS.md`：给 AI 助手使用的项目规则。

## 开发命令

```bash
pnpm install
pnpm build
```

日常开发在 `dev` 分支进行；`main` 只用于发布。发布 tag 必须指向 GitHub Actions 生成的 `[bot] bundle` 提交，详见 `RELEASE.md`。

## 模板来源

模板远端保留为：

```bash
git remote -v
```

其中 `template` 应指向 `https://github.com/StageDog/tavern_helper_template.git`。
