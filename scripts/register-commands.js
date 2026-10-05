import "dotenv/config";
import { commands } from "../src/commands.js";

const required = [
  "DISCORD_APPLICATION_ID",
  "DISCORD_BOT_TOKEN",
  "DISCORD_GUILD_ID"
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
  }
}

const url =
  `https://discord.com/api/v10/applications/${process.env.DISCORD_APPLICATION_ID}` +
  `/guilds/${process.env.DISCORD_GUILD_ID}/commands`;

const response = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(commands)
});

if (!response.ok) {
  throw new Error(`Discord command registration failed (${response.status}): ${await response.text()}`);
}

console.log(`Registered ${commands.length} guild command(s).`);
