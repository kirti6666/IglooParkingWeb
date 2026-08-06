// Bundles the whole site into ONE self-contained preview.html file that can be
// opened by double-clicking, with no server and no build step.
import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'

const result = await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  format: 'iife',
  minify: true,
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  define: {
    'process.env.NODE_ENV': '"production"',
    // The single-file preview has no backend, so it deliberately runs in
    // local mode. (import.meta isn't available in an IIFE bundle anyway.)
    'import.meta.env': '{}',
  },
  write: false,
  outdir: 'out',
})

let js = '', css = ''
for (const f of result.outputFiles) {
  if (f.path.endsWith('.css')) css += f.text
  else js += f.text
}

// Guard: a literal "</script>" inside the bundle would end the tag early.
js = js.replaceAll('</script', '<\\/script')

const html = readFileSync('index.html', 'utf8')
  // NOTE: replacement MUST be a function. A string replacement treats $&, $`,
  // $' and $1 as special patterns, and minified JS contains them — that
  // silently corrupts the bundle and throws a SyntaxError at runtime.
  .replace(
    '<script type="module" src="/src/main.jsx"></script>',
    () => `<style>${css}</style>\n    <script>${js}</script>`,
  )
  .replace('<link rel="icon" type="image/svg+xml" href="./favicon.svg" />', () => '')

writeFileSync('preview.html', html)
console.log('preview.html:', (html.length / 1024).toFixed(0), 'kB')
