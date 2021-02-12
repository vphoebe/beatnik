module.exports = {
  apps: [
    {
      script: "index.js",
      name: "beatnik",
    },
  ],

  deploy: {
    tarta: {
      user: "nick",
      host: "tarta",
      ref: "origin/main",
      repo: "git@github.com:vphoebe/beatnik.git",
      path: "/sjw/beatnik",
      "post-deploy":
        "npm install && pm2 reload ecosystem.config.js --env production",
    },
  },
};
