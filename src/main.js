// 获取版本号
const { version } = require("./constants");
const program = require("commander");
const path = require("path");

const mapActions = {
  create: {
    alias: "c",
    description: "create a project",
    examples: ["kpq-cli create <project-name>"],
  },
  config: {
    alias: "conf",
    description: "config project variable",
    examples: ["kpq-cli config set <k><v>", "kpq-cli config get <k>"],
  },
  update: {
    alias: "up",
    description: "update project variable",
    examples: ["kpq-cli config update <k><v>", "kpq-cli config update <k>"],
  },
  "*": {
    alias: "",
    description: "command not found",
    examples: [],
  },
};
Reflect.ownKeys(mapActions).forEach((action) => {
  program
    .command(action)
    .alias(mapActions[action].alias)
    .description(mapActions[action].description)
    .action(() => {
      if (action === "*") {
        console.log(mapActions[action].description);
      } else {
        const actionFile = require(path.resolve(__dirname, action));
        actionFile(...process.argv.slice(3));
      }
    });
});
program.on("--help", () => {
  console.log("\nExamples:");
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => {
      console.log(`${example}`);
    });
  });
});
program.version(version).parse(process.argv);
