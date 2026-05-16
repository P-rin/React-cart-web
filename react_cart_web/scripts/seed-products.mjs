import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'
import { loadMockProducts } from './lib/mock-products.mjs'

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MSG_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missingVars = requiredVars.filter((key) => !process.env[key])
if (missingVars.length > 0) {
  console.error('Missing required env vars:', missingVars.join(', '))
  process.exit(1)
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MSG_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DB_URL,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const mockProducts = loadMockProducts()

async function seedProducts() {
  console.log(`Seeding ${mockProducts.length} products to Firestore...`)

  for (const item of mockProducts) {
    const productRef = doc(db, 'products', item.id)

    await setDoc(
      productRef,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    console.log(`Upserted: ${item.name} (${item.id})`)
  }

  console.log('Product seed completed successfully.')
}

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed products:', error)
    process.exit(1)
  })
