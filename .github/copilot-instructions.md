# Copilot 執行指引

跨 agent 共用的專案架構、安全規範、指令及完成標準以根目錄 `AGENTS.md` 為準；這裡只定義 Copilot 接手 Issue 與提交 PR 的流程。

## 接手 Issue

- 開始前完整閱讀 Issue、驗收條件及 `AGENTS.md`，先確認需求與修改範圍。
- 若缺少會影響架構、相容性、安全性或驗收結果的關鍵資訊，先在 Issue 說明問題並等待釐清；不要自行擴大需求。
- 以最小必要差異完成工作。不要順手重構、不新增部署、不操作 Discord/Cloudflare 外部資源。
- 每一項 Acceptance Criteria 都要對應實作與驗證；無法完成的項目要明確標示原因，不可宣稱已完成。

## 驗證與 PR

- 按 `AGENTS.md` 執行適用的測試。至少執行 `npm test`；若沒有相關測試或測試無法執行，清楚說明。
- PR 使用 repo 的 Pull Request template；填寫關聯 Issue、修改內容、驗收條件結果、測試指令與輸出摘要、風險及未完成事項。
- 不要自行部署、合併 PR、修改 GitHub 規則或憑證，也不要聲稱 ChatGPT 已自動 review。
- 提交前檢查 diff，確認沒有 secrets、產生檔、無關重構或超出 Issue 的修改。
