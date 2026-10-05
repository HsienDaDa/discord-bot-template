# Agent 指引

本檔是所有 AI agent 與貢獻者共用的專案事實與長期工程規範。Copilot 專屬的 Issue 執行及 PR 提交流程見 `.github/copilot-instructions.md`。

## 專案概覽

- 本專案是 JavaScript、Node.js 與 Cloudflare Workers 的 Discord HTTP Interactions Bot 範本。
- 只使用 HTTP Interactions 與 Slash Commands；不使用 Discord Gateway，也不需要 Message Content、Presence 或 Server Members intents。
- `src/index.js` 負責 Worker 路由、Discord 請求簽章驗證與 interaction handler。
- `src/commands.js` 定義 Slash Commands。
- `scripts/register-commands.js` 註冊開發 Guild Commands；`scripts/bootstrap.js` 只輸出設定檢查與安裝資訊。
- `bot.config.json` 是 Bot 安裝 scopes、permissions、commands 與 intents 的宣告來源。

## 開發環境與指令

- Node.js 18 以上。
- 安裝相依套件：`npm install`。
- 執行測試：`npm test`（使用 Node.js 內建 test runner）。
- 本機執行：`npm run dev`。
- 產生 bootstrap 資訊：`npm run bootstrap`。
- 註冊開發用 Guild Commands：`npm run register`；此指令會呼叫 Discord API，除非使用者明確要求，不要在 review 或一般驗證時執行。
- 部署：`npm run deploy`；任何 agent 都不得自行部署，除非使用者明確要求。

## 工程與安全規範

- 盡量沿用現有模組與依賴；變更需聚焦於需求及其必要測試。
- 對外輸入一律視為不可信資料；保持 Discord Ed25519 簽章及 timestamp 驗證，不可繞過驗證以處理互動。
- 驗證失敗、未知 interaction type、Discord API 失敗等情況需明確且安全地處理；不可回傳 secrets 或內部堆疊到使用者。
- Token、Public Key、Guild ID 等環境設定不可硬編碼；不得提交 `.env`、真實憑證、個人資料或私有測試資料。範例值必須明確是假資料。
- 不要增加不必要的 Discord intents、OAuth scopes、bot permissions、Gateway 依賴或全域 command 註冊行為。
- 不得推測或自動修改 Discord Developer Portal、Cloudflare 帳戶、Worker secrets 或部署設定。
- 維持 Node.js 18+ 相容性及目前 ESM 模組格式；新增 runtime dependency 前先確認確有必要。
- 新增或修改程式碼時，使用清楚、精簡的英文識別字；依檔案既有語言和風格撰寫註解及文件。

## 完成標準

- 需求中的驗收條件逐項完成，非目標與未要求的行為保持不變。
- 針對行為變更新增或更新測試，並執行 `npm test`；如未執行，需在 PR 說明原因。
- 檢查差異，確認沒有 secrets、無關檔案、未授權部署或 Discord/GitHub 外部副作用。
- PR 說明變更範圍、測試結果、已知限制及未完成項目。
