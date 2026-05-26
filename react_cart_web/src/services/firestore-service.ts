import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  runTransaction,
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

export type StockAdjustmentInput = {
  productId: string
  adjustment: number
  reason?: string
  actor?: {
    userId?: string
    email?: string
  }
}

const normalizeProductStatus = (value: unknown): ProductStatus => {
  const status = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (status === 'active' || status === 'inactive' || status === 'discontinued') {
    return status
  }
  return 'inactive'
}

const normalizeProduct = (productId: string, raw: Record<string, unknown>): Product => ({
  productId,
  name: typeof raw.name === 'string' ? raw.name : '',
  description: typeof raw.description === 'string' ? raw.description : '',
  category: typeof raw.category === 'string' ? raw.category : 'Uncategorized',
  subcategory: typeof raw.subcategory === 'string' ? raw.subcategory : '',
  price: typeof raw.price === 'number' ? raw.price : 0,
  originalPrice: typeof raw.originalPrice === 'number' ? raw.originalPrice : undefined,
  currency: typeof raw.currency === 'string' ? raw.currency : 'THB',
  stock: typeof raw.stock === 'number' ? raw.stock : 0,
  status: normalizeProductStatus(raw.status),
  images: Array.isArray(raw.images)
    ? raw.images.filter((image): image is string => typeof image === 'string')
    : [],
  specifications:
    raw.specifications && typeof raw.specifications === 'object'
      ? (raw.specifications as Record<string, string>)
      : {},
  rating: typeof raw.rating === 'number' ? raw.rating : 0,
  reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
  tags: Array.isArray(raw.tags)
    ? raw.tags.filter((tag): tag is string => typeof tag === 'string')
    : [],
  sku: typeof raw.sku === 'string' ? raw.sku : '',
  supplier: typeof raw.supplier === 'string' ? raw.supplier : '',
})

export const productsService = {
  async getProducts(params?: {
    search?: string
    category?: string
    includeInactive?: boolean
  }): Promise<Product[]> {
    const snapshot = await getDocs(collection(db, 'products'))
    let products = snapshot.docs.map((item) =>
      normalizeProduct(item.id, item.data() as Record<string, unknown>),
    )

    products = products.filter((product) => product.name.trim().length > 0)

    if (!params?.includeInactive) {
      products = products.filter((product) => product.status === 'active')
    }

    const search = params?.search?.trim().toLowerCase()
    if (search) {
      products = products.filter((product) =>
        product.name.toLowerCase().includes(search),
      )
    }

    if (params?.category && params.category !== 'all') {
      products = products.filter((product) => product.category === params.category)
    }

    return products.sort((left, right) => left.name.localeCompare(right.name))
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

  async softDeleteProduct(productId: string): Promise<void> {
    const productRef = doc(db, 'products', productId)
    await updateDoc(productRef, {
      status: 'inactive',
      updatedAt: serverTimestamp(),
    })
  },

  async restoreProduct(productId: string): Promise<void> {
    const productRef = doc(db, 'products', productId)
    await updateDoc(productRef, {
      status: 'active',
      updatedAt: serverTimestamp(),
    })
  },

  async adjustProductStock(input: StockAdjustmentInput): Promise<number> {
    const productRef = doc(db, 'products', input.productId)

    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(productRef)
      if (!snapshot.exists()) {
        throw new Error('Product not found')
      }

      const raw = snapshot.data() as Record<string, unknown>
      const currentStock = typeof raw.stock === 'number' ? raw.stock : 0
      const nextStock = currentStock + input.adjustment

      if (nextStock < 0) {
        throw new Error('Stock cannot be negative')
      }

      transaction.update(productRef, {
        stock: nextStock,
        updatedAt: serverTimestamp(),
      })

      const adjustmentRef = doc(collection(db, 'stock_adjustments'))
      transaction.set(adjustmentRef, {
        adjustmentId: adjustmentRef.id,
        productId: input.productId,
        previousStock: currentStock,
        newStock: nextStock,
        adjustment: input.adjustment,
        reason: input.reason?.trim() ?? '',
        actorUserId: input.actor?.userId ?? '',
        actorEmail: input.actor?.email ?? '',
        createdAt: serverTimestamp(),
      })

      return nextStock
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

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash_on_delivery'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export type ShippingAddress = {
  fullName: string
  phone: string
  street: string
  district: string
  province: string
  postalCode: string
  country: string
}

export type OrderTimelineItem = {
  status: OrderStatus
  timestamp: Timestamp
  message?: string
}

export type OrderItem = {
  productId: string
  name: string
  quantity: number
  price: number
  subtotal: number
  specifications?: Record<string, string>
}

export type OrderDoc = {
  orderId: string
  userId: string
  orderNumber: string
  status: OrderStatus
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  subtotal: number
  shippingCost: number
  tax: number
  discountAmount: number
  totalAmount: number
  currency: string
  notes?: string
  trackingNumber?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  estimatedDelivery?: Timestamp
  timeline: OrderTimelineItem[]
}

export type ProcessOrderInput = {
  userId: string
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  shippingCost: number
  tax: number
  discountAmount: number
  notes?: string
}

export type ProcessOrderResult = {
  orderId: string
  orderNumber: string
  totalAmount: number
}

export type AdminOrderUpdateInput = {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  trackingNumber?: string
  note?: string
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
      addedAt: Timestamp.now(),
      ...(payload.image ? { image: payload.image } : {}),
      ...(payload.notes ? { notes: payload.notes } : {}),
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
  async getAllOrders(): Promise<OrderDoc[]> {
    const ordersRef = collection(db, 'orders')
    const snapshot = await getDocs(ordersRef)

    const orders = snapshot.docs.map((item) => ({
      orderId: item.id,
      ...(item.data() as Record<string, unknown>),
    })) as OrderDoc[]

    return orders.sort((left, right) => {
      const leftMs = left.createdAt?.toDate ? left.createdAt.toDate().getTime() : 0
      const rightMs = right.createdAt?.toDate ? right.createdAt.toDate().getTime() : 0
      return rightMs - leftMs
    })
  },

  async getUserOrders(userId: string): Promise<OrderDoc[]> {
    const ordersRef = collection(db, 'orders')
    const ordersQuery = query(ordersRef, where('userId', '==', userId))
    const snapshot = await getDocs(ordersQuery)

    const orders = snapshot.docs.map((item) => ({
      orderId: item.id,
      ...(item.data() as Record<string, unknown>),
    })) as OrderDoc[]

    return orders.sort((left, right) => {
      const leftMs = left.createdAt?.toDate ? left.createdAt.toDate().getTime() : 0
      const rightMs = right.createdAt?.toDate ? right.createdAt.toDate().getTime() : 0
      return rightMs - leftMs
    })
  },

  async getOrder(orderId: string): Promise<OrderDoc | null> {
    const orderRef = doc(db, 'orders', orderId)
    const snapshot = await getDoc(orderRef)
    if (!snapshot.exists()) {
      return null
    }

    return {
      orderId: snapshot.id,
      ...snapshot.data(),
    } as OrderDoc
  },

  async getUserOrdersByStatus(userId: string, status: OrderStatus): Promise<OrderDoc[]> {
    const orders = await this.getUserOrders(userId)
    return orders.filter((item) => item.status === status)
  },

  async cancelUserPendingOrder(userId: string, orderId: string) {
    const orderRef = doc(db, 'orders', orderId)

    await runTransaction(db, async (tx) => {
      const existing = await tx.get(orderRef)
      if (!existing.exists()) {
        throw new Error('Order not found')
      }

      const orderData = existing.data() as OrderDoc
      if (orderData.userId !== userId) {
        throw new Error('You do not have permission to cancel this order')
      }

      if (orderData.status !== 'pending') {
        throw new Error('Only pending orders can be cancelled')
      }

      const now = Timestamp.now()
      const timeline = [...(orderData.timeline ?? [])]
      timeline.push({
        status: 'cancelled',
        timestamp: now,
        message: 'Cancelled by customer',
      })

      for (const item of orderData.items ?? []) {
        const productRef = doc(db, 'products', item.productId)
        const productSnap = await tx.get(productRef)
        if (!productSnap.exists()) {
          continue
        }

        const productData = productSnap.data() as Product
        const currentStock = Number(productData.stock ?? 0)
        tx.update(productRef, {
          stock: currentStock + item.quantity,
          updatedAt: now,
        })
      }

      tx.update(orderRef, {
        status: 'cancelled',
        timeline,
        updatedAt: now,
      })
    })
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, message?: string) {
    const orderRef = doc(db, 'orders', orderId)
    const existing = await getDoc(orderRef)
    if (!existing.exists()) {
      throw new Error('Order not found')
    }

    const orderData = existing.data() as OrderDoc
    const timeline = [...(orderData.timeline ?? [])]
    timeline.push({
      status,
      timestamp: Timestamp.now(),
      message,
    })

    await updateDoc(orderRef, {
      status,
      timeline,
      updatedAt: Timestamp.now(),
    })
  },

  async adminUpdateOrder(orderId: string, input: AdminOrderUpdateInput) {
    const orderRef = doc(db, 'orders', orderId)
    await runTransaction(db, async (tx) => {
      const existing = await tx.get(orderRef)
      if (!existing.exists()) {
        throw new Error('Order not found')
      }

      const orderData = existing.data() as OrderDoc
      const nextStatus = input.status ?? orderData.status
      const note = input.note?.trim() ?? ''
      const timeline = [...(orderData.timeline ?? [])]
      const now = Timestamp.now()

      if (input.status && input.status !== orderData.status) {
        timeline.push({
          status: input.status,
          timestamp: now,
          message: note || `Admin updated status to ${input.status}`,
        })
      } else if (note) {
        timeline.push({
          status: nextStatus,
          timestamp: now,
          message: note,
        })
      }

      const shouldRestock = orderData.status !== 'cancelled' && nextStatus === 'cancelled'
      if (shouldRestock) {
        for (const item of orderData.items ?? []) {
          const productRef = doc(db, 'products', item.productId)
          const productSnap = await tx.get(productRef)
          if (!productSnap.exists()) {
            continue
          }

          const productData = productSnap.data() as Product
          const currentStock = Number(productData.stock ?? 0)
          tx.update(productRef, {
            stock: currentStock + item.quantity,
            updatedAt: now,
          })
        }
      }

      const updates: Record<string, unknown> = {
        updatedAt: now,
      }

      if (input.status) {
        updates.status = input.status
      }

      if (input.paymentStatus) {
        updates.paymentStatus = input.paymentStatus
      }

      if (typeof input.trackingNumber === 'string') {
        updates.trackingNumber = input.trackingNumber.trim()
      }

      if (timeline.length > (orderData.timeline ?? []).length) {
        updates.timeline = timeline
      }

      tx.update(orderRef, updates)
    })
  },
}

export async function processOrder(input: ProcessOrderInput): Promise<ProcessOrderResult> {
  const {
    userId,
    shippingAddress,
    paymentMethod,
    paymentStatus,
    shippingCost,
    tax,
    discountAmount,
    notes,
  } = input

  const cartRef = doc(db, 'carts', `cart_${userId}`)
  const orderRef = doc(collection(db, 'orders'))

  return runTransaction(db, async (tx) => {
    const cartSnap = await tx.get(cartRef)
    if (!cartSnap.exists()) {
      throw new Error('Cart is empty or not found')
    }

    const cartData = cartSnap.data() as CartDoc
    const cartItems = cartData.items ?? []
    if (cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    for (const item of cartItems) {
      const productRef = doc(db, 'products', item.productId)
      const productSnap = await tx.get(productRef)
      if (!productSnap.exists()) {
        throw new Error(`Product not found: ${item.productId}`)
      }

      const productData = productSnap.data() as Product
      const availableStock = Number(productData.stock ?? 0)
      if (availableStock < item.quantity) {
        throw new Error(`Stock is not enough for ${item.name}`)
      }

      tx.update(productRef, {
        stock: availableStock - item.quantity,
        updatedAt: Timestamp.now(),
      })
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)
    const totalAmount = Math.max(0, subtotal + shippingCost + tax - discountAmount)

    const now = Timestamp.now()
    const estimatedDelivery = Timestamp.fromDate(
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    )

    const status: OrderStatus = paymentStatus === 'completed' ? 'confirmed' : 'pending'
    const timeline: OrderTimelineItem[] = [
      {
        status: 'pending',
        timestamp: now,
        message: 'Order created successfully',
      },
    ]

    if (status === 'confirmed') {
      timeline.push({
        status: 'confirmed',
        timestamp: now,
        message: 'Payment completed',
      })
    }

    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${orderRef.id.slice(0, 6).toUpperCase()}`

    const normalizedNotes = typeof notes === 'string' ? notes.trim() : ''

    const orderPayload: OrderDoc = {
      orderId: orderRef.id,
      userId,
      orderNumber,
      status,
      items: cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        specifications: item.specifications,
      })),
      shippingAddress,
      paymentMethod,
      paymentStatus,
      subtotal,
      shippingCost,
      tax,
      discountAmount,
      totalAmount,
      currency: 'THB',
      ...(normalizedNotes ? { notes: normalizedNotes } : {}),
      createdAt: now,
      updatedAt: now,
      estimatedDelivery,
      timeline,
    }

    tx.set(orderRef, orderPayload)
    tx.delete(cartRef)

    return {
      orderId: orderRef.id,
      orderNumber,
      totalAmount,
    }
  })
}
