# 发布流程

## Branch Model

- `dev`：默认开发分支。日常开发、修复、准备文档、模板同步 PR 都先进入这里。
- `main`：发布分支。只接受从 `dev` 或 `release/vX.YY` 合并来的可发布源码快照。
- `release/vX.YY`：可选临时分支。用于发布前冻结、改版本号、补变更说明和处理发布前小修。
- `chore/template-sync-*`：模板同步分支。只合并到 `dev`，验证后随下一次发布进入 `main`。

## Daily Development

1. 确认当前在 `dev`：
   `git switch dev`
2. 开发或调整文档。
3. 验证：
   `pnpm install`
   `pnpm build`
4. 提交到 `dev`。

## Release Steps

1. 从 `dev` 创建发布分支：
   `git switch dev`
   `git pull --ff-only`
   `git switch -c release/vX.YY`
2. 更新版本号、README 导入链接和变更说明。
3. 在 `release/vX.YY` 验证：
   `pnpm install`
   `pnpm build`
4. 合并到 `main`：
   `git switch main`
   `git pull --ff-only`
   `git merge --no-ff release/vX.YY`
   `git push origin main`
5. 等待 GitHub Actions 的 `bundle` workflow 完成。
6. 确认 `main` 最新提交标题为 `[bot] bundle`，且存在 `dist/角色卡管理器/index.js`。
7. 将 tag 指向 `[bot] bundle` 提交：
   `git fetch origin main --tags`
   `git tag -f vX.YY origin/main`
   `git push origin vX.YY --force`
8. 在 GitHub Release 中创建或更新 `vX.YY`，Release 目标也必须是 `[bot] bundle`。
9. 将发布结果回合并到 `dev`：
   `git switch dev`
   `git merge --no-ff main`
   `git push origin dev`

## Hard Rules

- 不直接在 `main` 开发。
- 不使用自动递增版本号或自动打 tag。
- 不把 tag 指向源码提交。
- 不在 bundle workflow 之外手写 `dist` 产物作为发布结果。
- 发布前必须确认真实导入链接能访问构建后的 `dist/角色卡管理器/index.js`。

## Import Link Pattern

新项目远端确定后，导入链接按以下模式维护：

```text
https://testingcf.jsdelivr.net/gh/<owner>/<repo>@vX.YY/dist/角色卡管理器/index.js
```

开发期临时测试可以使用 `@main`，正式传播优先使用版本 tag。
