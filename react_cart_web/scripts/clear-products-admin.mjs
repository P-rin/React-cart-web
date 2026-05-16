import { initAdminFirestore } from './lib/admin-app.mjs'
import { loadMockProducts } from './lib/mock-products.mjs'

async function clearMockProducts() {
  const db = initAdminFirestore()
  const mockProducts = loadMockProducts()

  if (!Array.isArray(mockProducts) || mockProducts.length === 0) {
    throw new Error('No mock products found in scripts/data/mock-products.json')
  }

  console.log(`Deleting ${mockProducts.length} mock products from Firestore...`)

  const batch = db.batch()
  for (const item of mockProducts) {
    if (!item?.id) {
      continue
    }
    const ref = db.collection('products').doc(item.id)
    batch.delete(ref)
  }

  await batch.commit()
  console.log('Mock product cleanup completed successfully.')
}

clearMockProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to clear mock products:', error)
    process.exit(1)
  })
