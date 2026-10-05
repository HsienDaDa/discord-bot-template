const INTERACTION_TYPE_PING = 1;
const INTERACTION_TYPE_APPLICATION_COMMAND = 2;
const INTERACTION_TYPE_MESSAGE_COMPONENT = 3;
const INTERACTION_TYPE_MODAL_SUBMIT = 5;
const INTERACTION_RESPONSE_TYPE_PONG = 1;
const INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE = 4;
const INTERACTION_RESPONSE_TYPE_MODAL = 9;
const COMPONENT_TYPE_ACTION_ROW = 1;
const COMPONENT_TYPE_BUTTON = 2;
const COMPONENT_TYPE_STRING_SELECT = 3;
const COMPONENT_TYPE_TEXT_INPUT = 4;
const COMPONENT_TYPE_LABEL = 18;
const BUTTON_STYLE_PRIMARY = 1;
const TEXT_INPUT_STYLE_SHORT = 1;
const TEXT_INPUT_STYLE_PARAGRAPH = 2;

export function hexToBytes(value) {
  if (typeof value !== "string" || !/^[\da-f]+$/i.test(value) || value.length % 2 !== 0) {
    throw new Error("Value must be an even-length hexadecimal string");
  }

  return Uint8Array.from(value.match(/[\da-f]{2}/gi), (byte) => parseInt(byte, 16));
}

async function verifyDiscordRequest(request, rawBody, publicKey) {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");

  if (
    !signature ||
    !/^[\da-f]{128}$/i.test(signature) ||
    !timestamp ||
    timestamp.trim() === "" ||
    !/^[\da-f]{64}$/i.test(publicKey)
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(publicKey),
    { name: "Ed25519" },
    false,
    ["verify"]
  );
  const signedMessage = new TextEncoder().encode(timestamp + rawBody);

  return crypto.subtle.verify(
    { name: "Ed25519" },
    key,
    hexToBytes(signature),
    signedMessage
  );
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "POST" }
      });
    }

    if (!env.DISCORD_PUBLIC_KEY) {
      return new Response("DISCORD_PUBLIC_KEY is not configured", { status: 500 });
    }

    const rawBody = await request.text();
    let isValid;

    try {
      isValid = await verifyDiscordRequest(request, rawBody, env.DISCORD_PUBLIC_KEY);
    } catch (error) {
      console.error("Discord signature verification failed:", error);
      return new Response("Invalid request signature", { status: 401 });
    }

    if (!isValid) {
      return new Response("Invalid request signature", { status: 401 });
    }

    let interaction;
    try {
      interaction = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (interaction.type === INTERACTION_TYPE_PING) {
      return jsonResponse({ type: INTERACTION_RESPONSE_TYPE_PONG });
    }

    if (
      interaction.type === INTERACTION_TYPE_APPLICATION_COMMAND &&
      interaction.data?.name === "ping"
    ) {
      return jsonResponse({
        type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
        data: { content: "pong" }
      });
    }

    if (
      interaction.type === INTERACTION_TYPE_APPLICATION_COMMAND &&
      interaction.data?.name === "hello"
    ) {
      const name = interaction.data.options?.find((option) => option.name === "name")?.value;
      if (typeof name !== "string") {
        return jsonResponse({
          type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
          data: { content: "Missing required name option" }
        });
      }

      return jsonResponse({
        type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
        data: { content: `Hello ${name}` }
      });
    }

    if (
      interaction.type === INTERACTION_TYPE_APPLICATION_COMMAND &&
      interaction.data?.name === "status"
    ) {
      return jsonResponse({
        type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
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
    }

    if (
      interaction.type === INTERACTION_TYPE_APPLICATION_COMMAND &&
      interaction.data?.name === "actions"
    ) {
      return jsonResponse({
        type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
        data: {
          content: "Choose an action",
          components: [
            {
              type: COMPONENT_TYPE_ACTION_ROW,
              components: [
                {
                  type: COMPONENT_TYPE_BUTTON,
                  style: BUTTON_STYLE_PRIMARY,
                  label: "測試按鈕",
                  custom_id: "test_button"
                }
              ]
            }
          ]
        }
      });
    }

    if (
      interaction.type === INTERACTION_TYPE_MESSAGE_COMPONENT &&
      interaction.data?.custom_id === "test_button"
    ) {
      return jsonResponse({
        type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
        data: { content: "Button clicked!" }
      });
    }

    if (
      interaction.type === INTERACTION_TYPE_APPLICATION_COMMAND &&
      interaction.data?.name === "select"
    ) {
      return jsonResponse({
        type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
        data: {
          content: "Choose a platform",
          components: [
            {
              type: COMPONENT_TYPE_ACTION_ROW,
              components: [
                {
                  type: COMPONENT_TYPE_STRING_SELECT,
                  custom_id: "platform_select",
                  placeholder: "Select a platform",
                  options: [
                    { label: "Android", value: "android" },
                    { label: "iOS", value: "ios" },
                    { label: "Web", value: "web" }
                  ]
                }
              ]
            }
          ]
        }
      });
    }

    if (
      interaction.type === INTERACTION_TYPE_MESSAGE_COMPONENT &&
      interaction.data?.custom_id === "platform_select"
    ) {
      const [selectedValue] = interaction.data.values ?? [];
      return jsonResponse({
        type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
        data: {
          content:
            typeof selectedValue === "string"
              ? `You selected: ${selectedValue}`
              : "No platform selected"
        }
      });
    }

    if (
      interaction.type === INTERACTION_TYPE_APPLICATION_COMMAND &&
      interaction.data?.name === "form"
    ) {
      return jsonResponse({
        type: INTERACTION_RESPONSE_TYPE_MODAL,
        data: {
          custom_id: "feedback_modal",
          title: "Feedback Form",
          components: [
            {
              type: COMPONENT_TYPE_LABEL,
              label: "Name",
              component: {
                type: COMPONENT_TYPE_TEXT_INPUT,
                custom_id: "name_input",
                style: TEXT_INPUT_STYLE_SHORT,
                required: true,
                placeholder: "Enter your name"
              }
            },
            {
              type: COMPONENT_TYPE_LABEL,
              label: "Message",
              component: {
                type: COMPONENT_TYPE_TEXT_INPUT,
                custom_id: "message_input",
                style: TEXT_INPUT_STYLE_PARAGRAPH,
                required: true,
                placeholder: "Enter your message"
              }
            }
          ]
        }
      });
    }

    if (
      interaction.type === INTERACTION_TYPE_MODAL_SUBMIT &&
      interaction.data?.custom_id === "feedback_modal"
    ) {
      const components = interaction.data.components ?? [];
      const name = components.find(
        (item) => item.component?.custom_id === "name_input"
      )?.component.value;
      const message = components.find(
        (item) => item.component?.custom_id === "message_input"
      )?.component.value;

      return jsonResponse({
        type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
        data: {
          content: `Name: ${name}\nMessage: ${message}`,
          allowed_mentions: { parse: [] }
        }
      });
    }

    return jsonResponse({
      type: INTERACTION_RESPONSE_TYPE_CHANNEL_MESSAGE,
      data: { content: "Unknown command" }
    });
  }
};
