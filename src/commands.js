const COMMAND_OPTION_STRING = 3;

export const commands = [
  {
    name: "ping",
    description: "Replies with pong"
  },
  {
    name: "hello",
    description: "Say hello",
    options: [
      {
        type: COMMAND_OPTION_STRING,
        name: "name",
        description: "Name to greet",
        required: true
      }
    ]
  },
  {
    name: "status",
    description: "Show bot status"
  },
  {
    name: "actions",
    description: "Show interactive actions"
  },
  {
    name: "select",
    description: "Choose a platform"
  },
  {
    name: "form",
    description: "Open feedback form"
  }
];
