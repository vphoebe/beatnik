module.exports = {
  apps: [
    {
      script: "build/index.js",
      name: "beatnik",
    },
  ],

  deploy: {
    production: {
      user: "nick",
      host: "tarta",
      ref: "origin/main",
      repo: "git@github.com:vphoebe/beatnik.git",
      path: "/sjw/beatnik",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
    },
  },
};
