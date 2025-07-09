import { readdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// Эмуляция __dirname в ES-модулях
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Папки, которые нужно игнорировать
const ignoredFolders = ['node_modules', '.git']

async function printTree(dirPath, indent = '') {
  const entries = await readdir(dirPath, { withFileTypes: true })

  const folders = entries.filter((e) => e.isDirectory() && !ignoredFolders.includes(e.name))
  const files = entries.filter((e) => e.isFile())

  for (const folder of folders) {
    console.log(`${indent}- ${folder.name}/`)
    await printTree(path.join(dirPath, folder.name), indent + '  ')
  }

  for (const file of files) {
    console.log(`${indent}- ${file.name}`)
  }
}

// Запуск
const rootDir = process.argv[2] ? path.resolve(process.argv[2]) : __dirname
console.log(`Дерево файлов для: ${rootDir}\n`)
await printTree(rootDir)
