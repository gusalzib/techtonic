const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  // change the dev server port from default 8080 to 5173
  devServer: {
    port: 5173
  }
})
