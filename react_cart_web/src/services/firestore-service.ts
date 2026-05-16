import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
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

export type CartItemInput = {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  specifications?: Record<string, string>
  stock?: number
}

export type CartItem = CartItemInput & {
  addedAt: Timestamp
  subtotal: number
}

export type CartDoc = {
  cartId: string
  userId: string
  items: CartItem[]
  totalItems: number
  totalPrice: number
  lastUpdated: Timestamp
}

export type WhitelistItem = {
  productId: string
  name: string
  price: number
  image?: string
  addedAt: Timestamp
  notes?: string
}

export type WhitelistDoc = {
  whitelistId: string
  userId: string
  items: WhitelistItem[]
  totalItems: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

function toCartSummary(items: CartItem[]) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)
  return { totalItems, totalPrice }
}

export const cartsService = {
  async getCart(userId: string): Promise<CartDoc | null> {
    const cartRef = doc(db, 'carts', `cart_${userId}`)
    const snapshot = await getDoc(cartRef)
    if (!snapshot.exists()) {
      return null
    }
    return snapshot.data() as CartDoc
  },

  async addToCart(userId: string, product: CartItemInput, quantity = 1) {
    if (quantity <= 0) {
      throw new Error('Quantity must be at least 1')
    }

    const cartRef = doc(db, 'carts', `cart_${userId}`)
    const existingCart = await getDoc(cartRef)
    const availableStock =
      typeof product.stock === 'number'
        ? Math.max(0, product.stock)
        : Number.POSITIVE_INFINITY

    const { stock: _stock, ...cartInput } = product

    const newItem: CartItem = {
      ...cartInput,
      quantity,
      addedAt: Timestamp.now(),
      subtotal: product.price * quantity,
    }

    if (!existingCart.exists()) {
      if (quantity > availableStock) {
        throw new Error('Cannot add quantity greater than available stock')
      }

      const summary = toCartSummary([newItem])
      const cart: CartDoc = {
        cartId: `cart_${userId}`,
        userId,
        items: [newItem],
        totalItems: summary.totalItems,
        totalPrice: summary.totalPrice,
        lastUpdated: Timestamp.now(),
      }

      await setDoc(cartRef, cart)
      return cart
    }

    const cartData = existingCart.data() as CartDoc
    const itemIndex = cartData.items.findIndex((item) => item.productId === product.productId)

    if (itemIndex >= 0) {
      const target = cartData.items[itemIndex]
      const nextQuantity = target.quantity + quantity
      if (nextQuantity > availableStock) {
        throw new Error('Cannot add quantity greater than available stock')
      }

      target.quantity = nextQuantity
      target.subtotal = target.price * target.quantity
    } else {
      if (quantity > availableStock) {
        throw new Error('Cannot add quantity greater than available stock')
      }
      cartData.items.push(newItem)
    }

    const summary = toCartSummary(cartData.items)
    const updatedCart: CartDoc = {
      ...cartData,
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice,
      lastUpdated: Timestamp.now(),
    }

    await setDoc(cartRef, updatedCart)
    return updatedCart
  },

  async updateCartItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
    stock?: number,
  ) {
    const cartRef = doc(db, 'carts', `cart_${userId}`)
    const existingCart = await getDoc(cartRef)
    if (!existingCart.exists()) {
      throw new Error('Cart not found')
    }

    if (quantity < 1) {
      throw new Error('Quantity must be at least 1')
    }

    const cartData = existingCart.data() as CartDoc
    const itemIndex = cartData.items.findIndex((item) => item.productId === productId)
    if (itemIndex < 0) {
      throw new Error('Cart item not found')
    }

    if (typeof stock === 'number' && quantity > stock) {
      throw new Error('Cannot set quantity greater than available stock')
    }

    const target = cartData.items[itemIndex]
    target.quantity = quantity
    target.subtotal = target.price * quantity

    const summary = toCartSummary(cartData.items)
    const updatedCart: CartDoc = {
      ...cartData,
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice,
      lastUpdated: Timestamp.now(),
    }

    await setDoc(cartRef, updatedCart)
    return updatedCart
  },

  async removeFromCart(userId: string, productId: string) {
    const cartRef = doc(db, 'carts', `cart_${userId}`)
    const existingCart = await getDoc(cartRef)
    if (!existingCart.exists()) {
      return null
    }

    const cartData = existingCart.data() as CartDoc
    const items = cartData.items.filter((item) => item.productId !== productId)

    if (items.length === 0) {
      await deleteDoc(cartRef)
      return null
    }

    const summary = toCartSummary(items)
    const updatedCart: CartDoc = {
      ...cartData,
      items,
      totalItems: summary.totalItems,
      totalPrice: summary.totalPrice,
      lastUpdated: Timestamp.now(),
    }

    await setDoc(cartRef, updatedCart)
    return updatedCart
  },

  async clearCart(userId: string) {
    const cartRef = doc(db, 'carts', `cart_${userId}`)
    await deleteDoc(cartRef)
  },
}

export const whitelistsService = {
  async getWhitelist(userId: string): Promise<WhitelistDoc | null> {
    const whitelistRef = doc(db, 'whitelists', `wishlist_${userId}`)
    const snapshot = await getDoc(whitelistRef)
    if (!snapshot.exists()) {
      return null
    }
    return snapshot.data() as WhitelistDoc
  },

  async addToWhitelist(
    userId: string,
    payload: {
      productId: string
      name: string
      price: number
      image?: string
      notes?: string
    },
  ) {
    const whitelistRef = doc(db, 'whitelists', `wishlist_${userId}`)
    const existing = await getDoc(whitelistRef)

    const newItem: WhitelistItem = {
      productId: payload.productId,
      name: payload.name,
      price: payload.price,
      image: payload.image,
      notes: payload.notes,
      addedAt: Timestamp.now(),
    }

    if (!existing.exists()) {
      const nextDoc: WhitelistDoc = {
        whitelistId: `wishlist_${userId}`,
        userId,
        items: [newItem],
        totalItems: 1,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }

      await setDoc(whitelistRef, nextDoc)
      return nextDoc
    }

    const data = existing.data() as WhitelistDoc
    const alreadyExists = data.items.some((item) => item.productId === payload.productId)
    if (alreadyExists) {
      return data
    }

    const items = [...data.items, newItem]
    const nextDoc: WhitelistDoc = {
      ...data,
      items,
      totalItems: items.length,
      updatedAt: Timestamp.now(),
    }

    await setDoc(whitelistRef, nextDoc)
    return nextDoc
  },

  async removeFromWhitelist(userId: string, productId: string) {
    const whitelistRef = doc(db, 'whitelists', `wishlist_${userId}`)
    const existing = await getDoc(whitelistRef)
    if (!existing.exists()) {
      return null
    }

    const data = existing.data() as WhitelistDoc
    const items = data.items.filter((item) => item.productId !== productId)

    if (items.length === 0) {
      await deleteDoc(whitelistRef)
      return null
    }

    const nextDoc: WhitelistDoc = {
      ...data,
      items,
      totalItems: items.length,
      updatedAt: Timestamp.now(),
    }
    await setDoc(whitelistRef, nextDoc)
    return nextDoc
  },

  async toggleWhitelist(
    userId: string,
    payload: {
      productId: string
      name: string
      price: number
      image?: string
      notes?: string
    },
  ) {
    const current = await this.getWhitelist(userId)
    const exists = current?.items.some((item) => item.productId === payload.productId)

    if (exists) {
      await this.removeFromWhitelist(userId, payload.productId)
      return { inWhitelist: false }
    }

    await this.addToWhitelist(userId, payload)
    return { inWhitelist: true }
  },

  async isProductInWhitelist(userId: string, productId: string) {
    const current = await this.getWhitelist(userId)
    return current?.items.some((item) => item.productId === productId) ?? false
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
