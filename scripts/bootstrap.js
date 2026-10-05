import "dotenv/config";
import { readFile } from "node:fs/promises";

const config = JSON.parse(
  await readFile(new URL("../bot.config.json", import.meta.url), "utf8")
);

const permissions = {
  "View Channels": 1n << 10n,
  "Send Messages": 1n << 11n,
  "Embed Links": 1n << 14n,
  "Read Message History": 1n << 16n
};

const applicationId = process.env.DISCORD_APPLICATION_ID;
if (!applicationId) {
  throw new Error("Missing DISCORD_APPLICATION_ID. Copy .env.example to .env and fill it in.");
}

const permissionValue = config.install.permissions
  .reduce((total, permission) => total | (permissions[permission] ?? 0n), 0n)
  .toString();
const installUrl = new URL("https://discord.com/oauth2/authorize");
installUrl.searchParams.set("client_id", applicationId);
installUrl.searchParams.set("scope", config.install.scopes.join(" "));
installUrl.searchParams.set("permissions", permissionValue);

console.log("Bootstrap plan");
console.log("==============");
console.log("TODO: Configure the Discord Application in the Developer Portal.");
console.log("TODO: Set the Interaction Endpoint URL manually (or add a safe API integration).");
console.log("TODO: Register commands with `npm run register` after DISCORD_GUILD_ID is set.");
console.log("");
console.log("Generated Bot Install URL:");
console.log(installUrl.toString());

if (process.env.DISCORD_INTERACTIONS_ENDPOINT_URL) {
  console.log(`Interaction Endpoint URL: ${process.env.DISCORD_INTERACTIONS_ENDPOINT_URL}`);
} else {
  console.log("Interaction Endpoint URL: not set yet.");
}
