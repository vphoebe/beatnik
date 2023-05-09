module.exports = {
  apps: [
    {
      script: "build/index.cjs",
      name: "beatnik",
    },
    {
      script: "build/deploy-global-commands.cjs",
      name: "deploy-global-commands",
    },
  ],
};
