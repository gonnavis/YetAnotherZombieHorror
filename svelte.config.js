const sveltePreprocess = require('svelte-preprocess')

module.exports = {
  css: false,
  preprocess: sveltePreprocess({
    typescript: { tsconfigFile: './tsconfig.json' },
    globalStyle: { sourceMap: true }
  })
}
