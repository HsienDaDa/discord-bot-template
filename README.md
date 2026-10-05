# Discord HTTP Interactions Bot Template

這是一個使用 JavaScript、Node.js 與 Cloudflare Workers 的 Discord Bot Template。它只使用 Discord HTTP Interactions 與 Slash Commands，不使用 Discord Gateway，也不需要任何 Message Content Intent。

## 專案結構

- `src/index.js`：Cloudflare Worker；驗證 Discord Ed25519 signature、處理 Discord PING 與 `/ping`、`/hello`、`/status`、`/actions` 按鈕、`/select` 選單及 `/form` Modal 互動。
- `src/commands.js`：Slash Commands 定義。
- `scripts/register-commands.js`：將 commands 註冊成開發用 Guild Commands。
- `scripts/bootstrap.js`：輸出設定檢查、TODO 與 Bot Install URL。
- `bot.config.json`：Bot 安裝 scopes、permissions、commands 與 intents 宣告。

## 1. Discord Developer Portal

在 [Discord Developer Portal](https://discord.com/developers/applications) 建立 Application，並在 General Information 取得：

- **Application ID** → `DISCORD_APPLICATION_ID`
- **Public Key** → `DISCORD_PUBLIC_KEY`

在 Bot 頁面建立 Bot 並取得 **Bot Token** → `DISCORD_BOT_TOKEN`。Token 是 secret，絕對不要提交到 Git。

在 OAuth2 / Installation 確認 Guild Install，scopes 使用 `bot` 與 `applications.commands`，permissions 使用 `bot.config.json` 列出的四項。Presence Intent、Server Members Intent、Message Content Intent 全部保持關閉。

## 2. 安裝與本機設定

需要 Node.js 18 以上與 Cloudflare 帳號：

```sh
npm install
copy .env.example .env
```

將 `.env` 的 `DISCORD_APPLICATION_ID`、`DISCORD_PUBLIC_KEY`、`DISCORD_BOT_TOKEN`、`DISCORD_GUILD_ID` 填妥。`DISCORD_GUILD_ID` 是開發測試用的 Server ID。`.env` 已被 `.gitignore` 排除。

## 3. Cloudflare Worker

先登入並部署 Worker：

```sh
npx wrangler login
npm run deploy
```

將 Discord Public Key 設為 Worker secret（也可以改成 Wrangler 非 secret variable，但不要把值寫入版本庫）：

```sh
npx wrangler secret put DISCORD_PUBLIC_KEY
```

部署後，把 `https://<worker-name>.<account>.workers.dev` 加上 Discord Developer Portal 的 **Interactions Endpoint URL**。Discord 會送出驗證請求，Worker 會先驗證 `X-Signature-Ed25519` 與 `X-Signature-Timestamp`，驗證成功才回應。

## 4. 註冊與測試 `/ping`

Guild Commands 適合開發階段，更新很快：

```sh
npm run register
npm run bootstrap
```
使用 bootstrap 輸出的 Bot Install URL 將 Bot 安裝到測試 Guild。在 Discord 輸入 `/ping`，預期回覆 `pong`；輸入 `/hello name:Hsien`，預期回覆 `Hello Hsien`；輸入 `/status`，預期收到包含 Bot 狀態、架構與 Runtime 的 Embed；輸入 `/actions` 可顯示互動按鈕，點擊「測試按鈕」後會收到 `Button clicked!`；輸入 `/select` 可選擇 Android、iOS 或 Web，並收到所選值；輸入 `/form` 可開啟回饋表單，送出後會收到姓名與訊息。`npm run bootstrap` 只輸出規劃與安裝 URL；它不會猜測或自動修改 Discord Application 設定。

## 5. 建立新的 Bot

複製此 repository，修改 `bot.config.json` 的 Bot 名稱與 permissions，再在 `src/commands.js` 增加 Slash Commands 及 `src/index.js` 對應的 interaction handler。重新建立 `.env`、部署新的 Worker、設定新的 Interaction Endpoint URL，最後執行 `npm run register`。正式環境可另行加入 global command 註冊流程；本 template 第一版刻意只註冊 Guild Commands。

## 手動完成事項與限制

- Discord Application、Bot、Token 與測試 Guild 必須由使用者在 Developer Portal 建立或取得。
- Interaction Endpoint URL 目前必須在 Developer Portal 手動設定。
- `DISCORD_BOT_TOKEN` 僅供 command registration 使用，不會放進 Worker 程式碼。
- `scripts/bootstrap.js` 已預留未來自動處理 Application 設定、Endpoint URL、Commands 註冊與 Install URL 的位置；需要 Discord 官方 API 權限與明確設定後才能安全擴充。
- 本 Worker 只接受 POST，所有非驗證請求都會拒絕。
