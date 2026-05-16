/**
 * Firestore Service - Example Implementation
 * ใช้ร่วมกับ Firebase และ Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  writeBatch,
  transaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase-config'; // Setup ตามต้องการ

// ============ TYPE DEFINITIONS ============

interface User {
  userId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  address?: Address;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended' | 'inactive';
  preferences?: {
    currency: string;
    language: string;
    notifications: boolean;
  };
}

interface Product {
  productId: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  originalPrice?: number;
  currency: string;
  stock: number;
  status: 'active' | 'inactive' | 'discontinued';
  images: string[];
  specifications: Record<string, string>;
  rating: number;
  reviewCount: number;
  tags: string[];
  sku: string;
  supplier?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  specifications: Record<string, string>;
  addedAt: Timestamp;
  subtotal: number;
}

interface Cart {
  cartId: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  lastUpdated: Timestamp;
}

interface WhitelistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  addedAt: Timestamp;
  notes?: string;
}

interface Whitelist {
  whitelistId: string;
  userId: string;
  items: WhitelistItem[];
  totalItems: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  specifications: Record<string, string>;
}

interface OrderTimeline {
  status: string;
  timestamp: Timestamp;
  message?: string;
}

interface Order {
  orderId: string;
  userId: string;
  orderNumber: string;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded';
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  subtotal: number;
  shippingCost: number;
  tax: number;
  discountCode?: string;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  trackingNumber?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  estimatedDelivery?: Timestamp;
  timeline: OrderTimeline[];
}

interface Review {
  reviewId: string;
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  unhelpful: number;
  verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Address {
  street: string;
  district: string;
  province: string;
  postalCode: string;
  country: string;
}

// ============ USERS SERVICE ============

export const usersService = {
  // สร้างผู้ใช้ใหม่
  async createUser(userId: string, userData: Omit<User, 'createdAt' | 'updatedAt'>) {
    try {
      await setDoc(doc(db, 'users', userId), {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // ดึงข้อมูลผู้ใช้
  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as User) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  // อัพเดตข้อมูลผู้ใช้
  async updateUser(userId: string, updates: Partial<User>) {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // อัพเดตที่อยู่ผู้ใช้
  async updateUserAddress(userId: string, address: Address) {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        address,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  },
};

// ============ PRODUCTS SERVICE ============

export const productsService = {
  // ดึงข้อมูลสินค้า
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as Product) : null;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  },

  // ดึงสินค้าทั้งหมดในหมวดหมู่
  async getProductsByCategory(
    category: string,
    limitCount: number = 20
  ): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('category', '==', category),
        where('status', '==', 'active'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Product);
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }
  },

  // ค้นหาสินค้าด้วยเงื่อนไข
  async searchProducts(...constraints: QueryConstraint[]): Promise<Product[]> {
    try {
      const q = query(collection(db, 'products'), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Product);
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // สร้างสินค้า (Admin)
  async createProduct(productId: string, productData: Omit<Product, 'createdAt' | 'updatedAt'>) {
    try {
      await setDoc(doc(db, 'products', productId), {
        ...productData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // อัพเดตสินค้า (Admin)
  async updateProduct(productId: string, updates: Partial<Product>) {
    try {
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },
};

// ============ CARTS SERVICE ============

export const cartsService = {
  // ดึงตะกร้า
  async getCart(userId: string): Promise<Cart | null> {
    try {
      const docRef = doc(db, 'carts', `cart_${userId}`);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as Cart) : null;
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  },

  // เพิ่มสินค้าลงตะกร้า
  async addToCart(userId: string, product: Product, quantity: number) {
    try {
      const cartRef = doc(db, 'carts', `cart_${userId}`);
      const cart = await this.getCart(userId);

      const newItem: CartItem = {
        productId: product.productId,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images[0],
        specifications: product.specifications,
        addedAt: Timestamp.now(),
        subtotal: product.price * quantity,
      };

      if (cart) {
        // อัพเดตตะกร้าเดิม
        const existingItemIndex = cart.items.findIndex(
          (item) => item.productId === product.productId
        );

        let updatedItems = [...cart.items];
        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex].quantity += quantity;
          updatedItems[existingItemIndex].subtotal =
            updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
        } else {
          updatedItems.push(newItem);
        }

        const totalPrice = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

        await updateDoc(cartRef, {
          items: updatedItems,
          totalItems: updatedItems.length,
          totalPrice,
          lastUpdated: Timestamp.now(),
        });
      } else {
        // สร้างตะกร้าใหม่
        await setDoc(cartRef, {
          cartId: `cart_${userId}`,
          userId,
          items: [newItem],
          totalItems: 1,
          totalPrice: newItem.subtotal,
          lastUpdated: Timestamp.now(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // อัพเดตจำนวนสินค้า
  async updateCartItemQuantity(
    userId: string,
    productId: string,
    quantity: number
  ) {
    try {
      const cart = await this.getCart(userId);
      if (!cart) throw new Error('Cart not found');

      const updatedItems = cart.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              subtotal: item.price * quantity,
            }
          : item
      );

      const totalPrice = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

      const cartRef = doc(db, 'carts', `cart_${userId}`);
      await updateDoc(cartRef, {
        items: updatedItems,
        totalPrice,
        lastUpdated: Timestamp.now(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  // ลบสินค้าจากตะกร้า
  async removeFromCart(userId: string, productId: string) {
    try {
      const cart = await this.getCart(userId);
      if (!cart) throw new Error('Cart not found');

      const updatedItems = cart.items.filter((item) => item.productId !== productId);
      const totalPrice = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);

      const cartRef = doc(db, 'carts', `cart_${userId}`);
      if (updatedItems.length === 0) {
        await deleteDoc(cartRef);
      } else {
        await updateDoc(cartRef, {
          items: updatedItems,
          totalItems: updatedItems.length,
          totalPrice,
          lastUpdated: Timestamp.now(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // ล้างตะกร้า
  async clearCart(userId: string) {
    try {
      const cartRef = doc(db, 'carts', `cart_${userId}`);
      await deleteDoc(cartRef);
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },
};

// ============ WHITELISTS SERVICE ============

export const whitelistsService = {
  // ดึงรายการโปรด
  async getWhitelist(userId: string): Promise<Whitelist | null> {
    try {
      const docRef = doc(db, 'whitelists', `wishlist_${userId}`);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as Whitelist) : null;
    } catch (error) {
      console.error('Error getting whitelist:', error);
      throw error;
    }
  },

  // เพิ่มลงรายการโปรด
  async addToWhitelist(userId: string, product: Product, notes?: string) {
    try {
      const whitelistRef = doc(db, 'whitelists', `wishlist_${userId}`);
      const whitelist = await this.getWhitelist(userId);

      const newItem: WhitelistItem = {
        productId: product.productId,
        name: product.name,
        price: product.price,
        image: product.images[0],
        addedAt: Timestamp.now(),
        notes,
      };

      if (whitelist) {
        const itemExists = whitelist.items.some((item) => item.productId === product.productId);
        if (!itemExists) {
          const updatedItems = [...whitelist.items, newItem];
          await updateDoc(whitelistRef, {
            items: updatedItems,
            totalItems: updatedItems.length,
            updatedAt: Timestamp.now(),
          });
        }
      } else {
        await setDoc(whitelistRef, {
          whitelistId: `wishlist_${userId}`,
          userId,
          items: [newItem],
          totalItems: 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      throw error;
    }
  },

  // ลบจากรายการโปรด
  async removeFromWhitelist(userId: string, productId: string) {
    try {
      const whitelist = await this.getWhitelist(userId);
      if (!whitelist) throw new Error('Whitelist not found');

      const updatedItems = whitelist.items.filter((item) => item.productId !== productId);
      const whitelistRef = doc(db, 'whitelists', `wishlist_${userId}`);

      if (updatedItems.length === 0) {
        await deleteDoc(whitelistRef);
      } else {
        await updateDoc(whitelistRef, {
          items: updatedItems,
          totalItems: updatedItems.length,
          updatedAt: Timestamp.now(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      throw error;
    }
  },

  // ตรวจสอบว่าสินค้าอยู่ในรายการโปรดหรือไม่
  async isProductInWhitelist(userId: string, productId: string): Promise<boolean> {
    try {
      const whitelist = await this.getWhitelist(userId);
      return whitelist ? whitelist.items.some((item) => item.productId === productId) : false;
    } catch (error) {
      console.error('Error checking whitelist:', error);
      throw error;
    }
  },
};

// ============ ORDERS SERVICE ============

export const ordersService = {
  // ดึงรายการสั่งซื้อทั้งหมดของผู้ใช้
  async getUserOrders(userId: string, limitCount: number = 50): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Order);
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  },

  // ดึงรายการสั่งซื้อเดียว
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as Order) : null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  },

  // สร้างรายการสั่งซื้อใหม่
  async createOrder(orderId: string, orderData: Omit<Order, 'createdAt' | 'updatedAt'>) {
    try {
      await setDoc(doc(db, 'orders', orderId), {
        ...orderData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // อัพเดตสถานะรายการสั่งซื้อ
  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    message?: string
  ) {
    try {
      const order = await this.getOrder(orderId);
      if (!order) throw new Error('Order not found');

      const newTimeline: OrderTimeline = {
        status,
        timestamp: Timestamp.now(),
        message,
      };

      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, {
        status,
        timeline: [...order.timeline, newTimeline],
        updatedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // ดึงรายการสั่งซื้อตามสถานะ
  async getOrdersByStatus(
    userId: string,
    status: Order['status']
  ): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Order);
    } catch (error) {
      console.error('Error getting orders by status:', error);
      throw error;
    }
  },
};

// ============ REVIEWS SERVICE ============

export const reviewsService = {
  // ดึงรีวิวสินค้า
  async getProductReviews(productId: string, limitCount: number = 20): Promise<Review[]> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Review);
    } catch (error) {
      console.error('Error getting reviews:', error);
      throw error;
    }
  },

  // สร้างรีวิว
  async createReview(reviewId: string, reviewData: Omit<Review, 'createdAt' | 'updatedAt'>) {
    try {
      await setDoc(doc(db, 'reviews', reviewId), {
        ...reviewData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // อัพเดตจำนวน helpful
  async updateReviewHelpful(reviewId: string, isHelpful: boolean) {
    try {
      const review = await getDoc(doc(db, 'reviews', reviewId));
      if (!review.exists()) throw new Error('Review not found');

      const data = review.data() as Review;
      const updateData = {
        helpful: isHelpful ? data.helpful + 1 : data.helpful,
        unhelpful: !isHelpful ? data.unhelpful + 1 : data.unhelpful,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'reviews', reviewId), updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating review helpful:', error);
      throw error;
    }
  },
};

// ============ TRANSACTION EXAMPLE (สำหรับสั่งซื้อ) ============

/**
 * ตัวอย่าง Transaction สำหรับสั่งซื้อ:
 * 1. ลดจำนวนสินค้า
 * 2. สร้างรายการสั่งซื้อ
 * 3. ล้างตะกร้า
 */
export async function processOrder(
  userId: string,
  cart: Cart,
  orderData: Omit<Order, 'createdAt' | 'updatedAt' | 'orderId'>
) {
  try {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return await transaction(db, async (tx) => {
      // 1. ลดจำนวนสินค้าในคลัง
      for (const item of cart.items) {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await tx.get(productRef);

        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock;
          tx.update(productRef, {
            stock: currentStock - item.quantity,
          });
        }
      }

      // 2. สร้างรายการสั่งซื้อ
      const orderRef = doc(db, 'orders', orderId);
      tx.set(orderRef, {
        ...orderData,
        orderId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 3. ล้างตะกร้า
      const cartRef = doc(db, 'carts', `cart_${userId}`);
      tx.delete(cartRef);

      return { success: true, orderId };
    });
  } catch (error) {
    console.error('Error processing order:', error);
    throw error;
  }
}

// ============ BATCH OPERATIONS ============

/**
 * ตัวอย่าง Batch Write สำหรับอัพเดตหลายๆ documents พร้อมกัน
 */
export async function batchUpdateProducts(updates: Array<{ id: string; data: Partial<Product> }>) {
  try {
    const batch = writeBatch(db);

    updates.forEach(({ id, data }) => {
      const docRef = doc(db, 'products', id);
      batch.update(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error batch updating products:', error);
    throw error;
  }
}
