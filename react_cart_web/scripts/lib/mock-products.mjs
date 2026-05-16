import fs from 'node:fs'

export function loadMockProducts() {
  const filePath = new URL('../data/mock-products.json', import.meta.url)
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}
