//คำสั่ง Run Mock Script = npm run seed:products:admin
import { initAdminFirestore, adminTimestamp } from './lib/admin-app.mjs'
import { loadMockProducts } from './lib/mock-products.mjs'

async function seedProductsWithAdmin() {
  const db = initAdminFirestore()
  const now = adminTimestamp()
  const mockProducts = loadMockProducts()

  console.log(`Seeding ${mockProducts.length} products with Admin SDK...`)

  const batch = db.batch()

  for (const item of mockProducts) {
    const ref = db.collection('products').doc(item.id)

    batch.set(
      ref,
      {
        productId: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        price: item.price,
        originalPrice: item.originalPrice,
        currency: 'THB',
        stock: item.stock,
        status: item.status,
        images: item.images,
        specifications: item.specifications,
        rating: item.rating,
        reviewCount: item.reviewCount,
        tags: item.tags,
        sku: item.sku,
        supplier: item.supplier,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    )
  }

  await batch.commit()
  console.log('Admin seed completed successfully.')
}

seedProductsWithAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed products with Admin SDK:', error)
    process.exit(1)
  })
