module.exports = {
  apps: [
    {
      script: "build/index.js",
      name: "beatnik",
    },
    {
      script: "build/deploy-global-commands.js",
      name: "deploy-global-commands",
    },
  ],
};
