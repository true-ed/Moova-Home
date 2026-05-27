const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  publicPath: process.env.NODE_ENV === 'production' ? '/Moova-Home/' : '/',
  outputDir: 'docs',

  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        mac: {
          icon: "build/icon.png",
        },
      },
    },
  },
});
