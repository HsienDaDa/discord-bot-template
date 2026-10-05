import test from "node:test";
import assert from "node:assert/strict";
import worker, { hexToBytes } from "./index.js";
import { commands } from "./commands.js";

let keyPair;
let publicKey;

test.before(async () => {
  keyPair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const rawPublicKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  publicKey = Array.from(new Uint8Array(rawPublicKey), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
});

async function sendInteraction(interaction) {
  const body = JSON.stringify(interaction);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = new TextEncoder().encode(timestamp + body);
  const signature = await crypto.subtle.sign({ name: "Ed25519" }, keyPair.privateKey, message);
  const signatureHex = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  const request = new Request("https://example.com/interactions", {
    method: "POST",
    headers: {
      "X-Signature-Ed25519": signatureHex,
      "X-Signature-Timestamp": timestamp
    },
    body
  });

  return worker.fetch(request, { DISCORD_PUBLIC_KEY: publicKey });
}

test("hexToBytes parses a 32-byte public key", () => {
  const bytes = hexToBytes("ab".repeat(32));

  assert.equal(bytes.length, 32);
  assert.equal(bytes[0], 0xab);
});

test("hexToBytes parses a 64-byte signature", () => {
  const bytes = hexToBytes("cd".repeat(64));

  assert.equal(bytes.length, 64);
  assert.equal(bytes[0], 0xcd);
});

test("hexToBytes rejects malformed hexadecimal input", () => {
  assert.throws(() => hexToBytes("abc"), /even-length hexadecimal/);
  assert.throws(() => hexToBytes("zz"), /even-length hexadecimal/);
});

test("hello command has a required string name option", () => {
  const hello = commands.find((command) => command.name === "hello");

  assert.deepEqual(hello, {
    name: "hello",
    description: "Say hello",
    options: [
      {
        type: 3,
        name: "name",
        description: "Name to greet",
        required: true
      }
    ]
  });
});


test("status command has no options", () => {
  const status = commands.find((command) => command.name === "status");

  assert.deepEqual(status, {
    name: "status",
    description: "Show bot status"
  });
});

test("actions command has no options", () => {
  const actions = commands.find((command) => command.name === "actions");

  assert.deepEqual(actions, {
    name: "actions",
    description: "Show interactive actions"
  });
});

test("select command has no options", () => {
  const select = commands.find((command) => command.name === "select");

  assert.deepEqual(select, {
    name: "select",
    description: "Choose a platform"
  });
});

test("form command has no options", () => {
  const form = commands.find((command) => command.name === "form");

  assert.deepEqual(form, {
    name: "form",
    description: "Open feedback form"
  });
});

test("hello interaction responds with the supplied name", async () => {
  const response = await sendInteraction({
    type: 2,
    data: { name: "hello", options: [{ name: "name", type: 3, value: "Hsien" }] }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    type: 4,
    data: { content: "Hello Hsien" }
  });
});

test("status interaction responds with the requested embed", async () => {
  const response = await sendInteraction({
    type: 2,
    data: { name: "status" }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    type: 4,
    data: {
      embeds: [
        {
          title: "Discord Bot Status",
          description: "Bot is running normally",
          fields: [
            { name: "狀態", value: "Online" },
            { name: "架構", value: "HTTP Interactions" },
            { name: "Runtime", value: "Cloudflare Workers" }
          ]
        }
      ]
    }
  });
});

test("actions interaction responds with a primary button", async () => {
  const response = await sendInteraction({
    type: 2,
    data: { name: "actions" }
  });
  const payload = await response.json();
  const button = payload.data.components[0].components[0];

  assert.equal(response.status, 200);
  assert.equal(payload.data.content, "Choose an action");
  assert.equal(button.type, 2);
  assert.equal(button.style, 1);
  assert.equal(button.label, "測試按鈕");
});

test("actions button has the expected custom_id", async () => {
  const response = await sendInteraction({
    type: 2,
    data: { name: "actions" }
  });
  const payload = await response.json();

  assert.equal(payload.data.components[0].components[0].custom_id, "test_button");
});

test("clicking test_button responds with Button clicked!", async () => {
  const response = await sendInteraction({
    type: 3,
    data: { custom_id: "test_button" },
    message: { id: "message-id" }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    type: 4,
    data: { content: "Button clicked!" }
  });
});

test("select interaction responds with the expected string select menu", async () => {
  const response = await sendInteraction({
    type: 2,
    data: { name: "select" }
  });
  const payload = await response.json();
  const menu = payload.data.components[0].components[0];

  assert.equal(response.status, 200);
  assert.equal(payload.data.content, "Choose a platform");
  assert.equal(menu.type, 3);
  assert.equal(menu.custom_id, "platform_select");
  assert.equal(menu.placeholder, "Select a platform");
});

test("select menu contains Android, iOS, and Web values", async () => {
  const response = await sendInteraction({
    type: 2,
    data: { name: "select" }
  });
  const payload = await response.json();
  const options = payload.data.components[0].components[0].options;

  assert.deepEqual(options, [
    { label: "Android", value: "android" },
    { label: "iOS", value: "ios" },
    { label: "Web", value: "web" }
  ]);
});

test("selecting android responds with the selected value", async () => {
  const response = await sendInteraction({
    type: 3,
    data: { custom_id: "platform_select", values: ["android"] },
    message: { id: "message-id" }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    type: 4,
    data: { content: "You selected: android" }
  });
});

test("form interaction responds with the feedback modal", async () => {
  const response = await sendInteraction({
    type: 2,
    data: { name: "form" }
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.type, 9);
  assert.equal(payload.data.custom_id, "feedback_modal");
  assert.equal(payload.data.title, "Feedback Form");
  assert.equal(payload.data.components.length, 2);
  assert.deepEqual(payload.data.components, [
    {
      type: 18,
      label: "Name",
      component: {
        type: 4,
        custom_id: "name_input",
        style: 1,
        required: true,
        placeholder: "Enter your name"
      }
    },
    {
      type: 18,
      label: "Message",
      component: {
        type: 4,
        custom_id: "message_input",
        style: 2,
        required: true,
        placeholder: "Enter your message"
      }
    }
  ]);
});

test("feedback modal submission responds with both field values", async () => {
  const response = await sendInteraction({
    type: 5,
    data: {
      custom_id: "feedback_modal",
      components: [
        {
          type: 18,
          label: "Name",
          component: { type: 4, custom_id: "name_input", value: "Hsien" }
        },
        {
          type: 18,
          label: "Message",
          component: { type: 4, custom_id: "message_input", value: "Looks good" }
        }
      ]
    }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    type: 4,
    data: {
      content: "Name: Hsien\nMessage: Looks good",
      allowed_mentions: { parse: [] }
    }
  });
});

test("ping interaction still responds with pong", async () => {
  const response = await sendInteraction({
    type: 2,
    data: { name: "ping" }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    type: 4,
    data: { content: "pong" }
  });
});
