module.exports = {
  apps: [
    {
      script: "build/index.js",
      name: "beatnik",
    },
  ],

  deploy: {
    production: {
      user: "ec2-user",
      host: "beatnik.sjw.zone",
      key: "deploy.key",
      ref: "origin/release",
      repo: "https://github.com/vphoebe/beatnik.git",
      path: "/srv/beatnik-prod",
      "post-deploy":
        "npm install && npm run clean && npm run build && pm2 reload ecosystem.config.js --env production",
    },
  },
};
