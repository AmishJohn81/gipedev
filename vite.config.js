import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, rmSync } from 'node:fs'
import { resolve, sep } from 'node:path'

function copy5eTools() {
  return {
    name: 'copy-5etools',
    closeBundle() {
      const source = resolve('5eTools/dev')
      const destination = resolve('dist/5eTools/dev')
      const nodeModulesSegment = `${sep}node_modules${sep}`

      rmSync(destination, { recursive: true, force: true })
      cpSync(source, destination, {
        recursive: true,
        filter: (path) => !`${path}${sep}`.includes(nodeModulesSegment),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), copy5eTools()],
})
