import path from 'node:path'
import { createHash } from 'node:crypto'
import { cpSync, readdirSync, readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function receiverVersion(directory: string): string {
  const hash = createHash('sha256')
  function visit(relative: string) {
    for (const entry of readdirSync(path.join(directory, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.posix.join(relative, entry.name)
      if (entry.isDirectory()) visit(file)
      else hash.update(file).update('\0').update(readFileSync(path.join(directory, file))).update('\0')
    }
  }
  visit('')
  return hash.digest('hex').slice(0, 16)
}

export default defineConfig(({ command }) => {
  const receiverDirectory = path.resolve(__dirname, 'public/rs')
  const receiverBasePath = command === 'build' ? `/rs/releases/${receiverVersion(receiverDirectory)}` : '/rs'
  let outputDirectory: string
  return {
    define: {
      __RENDER_STREAMING_BASE_PATH__: JSON.stringify(receiverBasePath),
    },
    plugins: [react(), tailwindcss(), {
      name: 'version-renderstreaming-client',
      apply: 'build',
      configResolved(config) { outputDirectory = path.resolve(config.root, config.build.outDir) },
      closeBundle() {
        // Version the entire relative-import tree, including CSS and worklets.
        // A query on main.js alone leaves its imported modules cached for days.
        cpSync(receiverDirectory, path.join(outputDirectory, receiverBasePath.slice(1)), { recursive: true })
      },
    }],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
