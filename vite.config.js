import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve, sep } from 'node:path'

const noIndexMeta = '<meta name="robots" content="noindex, nofollow, noarchive">'

function addNoIndex(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      addNoIndex(path)
    } else if (entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8')

      if (!html.includes('name="robots"')) {
        writeFileSync(path, html.replace(/<head>/i, `<head>\n\t${noIndexMeta}`))
      }
    }
  }
}

function copy5eTools() {
  return {
    name: 'copy-5etools',
    closeBundle() {
      const source = resolve('5eTools/dev')
      const destination = resolve('dist/5eTools/dev')
      const nodeModulesSegment = `${sep}node_modules${sep}`

      rmSync(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
      cpSync(source, destination, {
        recursive: true,
        filter: (path) => !`${path}${sep}`.includes(nodeModulesSegment),
      })
      addNoIndex(destination)
    },
  }
}

export default defineConfig({
  plugins: [react(), copy5eTools()],
  build: {
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        asteroids: resolve('asteroids/index.html'),
      },
    },
  },
})
