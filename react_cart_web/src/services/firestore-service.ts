import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase-config'

export type ProductStatus = 'active' | 'inactive' | 'discontinued'

export type Product = {
  productId: string
  name: string
  description: string
  category: string
  subcategory?: string
  price: number
  originalPrice?: number
  currency: string
  stock: number
  status: ProductStatus
  images: string[]
  specifications: Record<string, string>
  rating: number
  reviewCount: number
  tags: string[]
  sku: string
  supplier?: string
}

export type ProductInput = {
  name: string
  description: string
  category: string
  subcategory?: string
  price: number
  originalPrice?: number
  stock: number
  sku: string
  status?: ProductStatus
  images: string[]
  specifications?: Record<string, string>
  tags?: string[]
  supplier?: string
}

export const productsService = {
  async getProducts(params?: {
    search?: string
    category?: string
    includeInactive?: boolean
  }): Promise<Product[]> {
    const constraints = []
    if (!params?.includeInactive) {
      constraints.push(where('status', '==', 'active'))
    }
    constraints.push(orderBy('name', 'asc'))

    const q = query(collection(db, 'products'), ...constraints)
    const snapshot = await getDocs(q)

    let products = snapshot.docs.map((item) => {
      const data = item.data() as Omit<Product, 'productId'>
      return { ...data, productId: item.id }
    })

    const search = params?.search?.trim().toLowerCase()
    if (search) {
      products = products.filter((product) =>
        product.name.toLowerCase().includes(search),
      )
    }

    if (params?.category && params.category !== 'all') {
      products = products.filter((product) => product.category === params.category)
    }

    return products
  },

  async getProductById(productId: string): Promise<Product | null> {
    const productRef = doc(db, 'products', productId)
    const snapshot = await getDoc(productRef)

    if (!snapshot.exists()) {
      return null
    }

    return {
      ...(snapshot.data() as Omit<Product, 'productId'>),
      productId: snapshot.id,
    }
  },

  async createProduct(input: ProductInput): Promise<string> {
    const payload = {
      name: input.name,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory ?? '',
      price: Number(input.price),
      originalPrice: input.originalPrice ? Number(input.originalPrice) : null,
      currency: 'THB',
      stock: Number(input.stock),
      status: input.status ?? 'active',
      images: input.images,
      specifications: input.specifications ?? {},
      rating: 0,
      reviewCount: 0,
      tags: input.tags ?? [],
      sku: input.sku,
      supplier: input.supplier ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const created = await addDoc(collection(db, 'products'), payload)
    await updateDoc(doc(db, 'products', created.id), {
      productId: created.id,
    })
    return created.id
  },

  async updateProduct(productId: string, input: ProductInput): Promise<void> {
    const productRef = doc(db, 'products', productId)

    await updateDoc(productRef, {
      name: input.name,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory ?? '',
      price: Number(input.price),
      originalPrice: input.originalPrice ? Number(input.originalPrice) : null,
      stock: Number(input.stock),
      status: input.status ?? 'active',
      images: input.images,
      specifications: input.specifications ?? {},
      tags: input.tags ?? [],
      sku: input.sku,
      supplier: input.supplier ?? '',
      updatedAt: serverTimestamp(),
    })
  },
}

type CartItemInput = {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

type CartItem = CartItemInput & {
  addedAt: Timestamp
  subtotal: number
}

type CartDoc = {
  cartId: string
  userId: string
  items: CartItem[]
  totalItems: number
  totalPrice: number
  lastUpdated: Timestamp
}

export const cartsService = {
  async addToCart(userId: string, product: CartItemInput, quantity = 1) {
    const cartRef = doc(db, 'carts', `cart_${userId}`)
    const existingCart = await getDoc(cartRef)

    const newItem: CartItem = {
      ...product,
      quantity,
      addedAt: Timestamp.now(),
      subtotal: product.price * quantity,
    }

    if (!existingCart.exists()) {
      const cart: CartDoc = {
        cartId: `cart_${userId}`,
        userId,
        items: [newItem],
        totalItems: 1,
        totalPrice: newItem.subtotal,
        lastUpdated: Timestamp.now(),
      }

      await setDoc(cartRef, cart)
      return cart
    }

    const cartData = existingCart.data() as CartDoc
    const itemIndex = cartData.items.findIndex((item) => item.productId === product.productId)

    if (itemIndex >= 0) {
      const target = cartData.items[itemIndex]
      target.quantity += quantity
      target.subtotal = target.price * target.quantity
    } else {
      cartData.items.push(newItem)
    }

    const totalPrice = cartData.items.reduce((sum, item) => sum + item.subtotal, 0)
    const updatedCart: CartDoc = {
      ...cartData,
      totalItems: cartData.items.length,
      totalPrice,
      lastUpdated: Timestamp.now(),
    }

    await setDoc(cartRef, updatedCart)
    return updatedCart
  },
}

export const ordersService = {
  async getUserOrders(userId: string) {
    const ordersRef = collection(db, 'orders')
    const ordersQuery = query(ordersRef, where('userId', '==', userId))
    const snapshot = await getDocs(ordersQuery)

    return snapshot.docs.map((item) => ({
      orderId: item.id,
      ...item.data(),
    }))
  },
}
