module.exports = {
  apps: [
    {
      script: "build/beatnik.cjs",
      name: "beatnik",
    },
    {
      script: "build/deploy-global-commands.cjs",
      name: "deploy-global-commands",
    },
  ],
};
