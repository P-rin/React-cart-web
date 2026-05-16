# 🚀 Quick Reference - Firestore E-Commerce Setup

## 📁 Files Created

1. **FIRESTORE_SCHEMA.md** - ความจำละเอียดเกี่ยวกับโครงสร้าง
2. **firestore-schema.json** - JSON format สำหรับอ้างอิง
3. **firestore-service-example.ts** - ตัวอย่าง Implementation ใน React/TypeScript

---

## 📊 Collections Overview

| Collection | ความจำ | ใช้สำหรับ | Primary Key |
|-----------|--------|----------|-----------|
| **users** | ข้อมูลผู้ใช้ | สมาชิก, profile | userId (Firebase UID) |
| **products** | ข้อมูลสินค้า | catalog | productId |
| **carts** | ตะกร้าสินค้า | shopping cart | cart_userId |
| **whitelists** | รายการโปรด | wishlist | wishlist_userId |
| **orders** | รายการสั่งซื้อ | order history | orderId |
| **reviews** | รีวิวสินค้า | product reviews | reviewId |
| **categories** | หมวดหมู่ | product categories | categoryId |
| **discounts** | โค้ดลดราคา | promo codes | code |

---

## 🔗 Data Relationships

```
┌─────────────────────────────────────────┐
│          FIRESTORE STRUCTURE             │
└─────────────────────────────────────────┘

users (1) ──┬─→ (many) carts
            ├─→ (many) whitelists
            └─→ (many) orders ──┬─→ (many) products
                                └─→ (many) timeline events

products (1) ──┬─→ (many) carts (items)
               ├─→ (many) whitelists (items)
               ├─→ (many) orders (items)
               └─→ (many) reviews

reviews ──────→ users (author)
         ──────→ products (reviewed item)
         ──────→ orders (verified purchase)
```

---

## 💾 Collection Details

### 1. Users
```typescript
{
  userId: string           // Firebase Auth UID
  email: string           // Unique
  username: string
  firstName: string
  lastName: string
  phone: string
  address: {
    street, district, province, postalCode, country
  }
  role: "customer" | "admin"
  status: "active" | "suspended" | "inactive"
  preferences: { currency, language, notifications }
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 2. Products
```typescript
{
  productId: string
  name: string
  description: string
  category: string
  subcategory: string
  price: number
  originalPrice?: number
  stock: number
  status: "active" | "inactive"
  images: string[]
  specifications: object
  rating: number (0-5)
  reviewCount: number
  sku: string (unique)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3. Carts
```typescript
{
  cartId: string          // Format: "cart_userId"
  userId: string          // FK → users
  items: [
    {
      productId: string
      name: string
      price: number
      quantity: number
      image: string
      addedAt: timestamp
      subtotal: number
    }
  ]
  totalItems: number
  totalPrice: number
  lastUpdated: timestamp
}
```

### 4. Whitelists
```typescript
{
  whitelistId: string     // Format: "wishlist_userId"
  userId: string          // FK → users
  items: [
    {
      productId: string
      name: string
      price: number
      image: string
      addedAt: timestamp
      notes?: string
    }
  ]
  totalItems: number
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 5. Orders
```typescript
{
  orderId: string
  userId: string          // FK → users
  orderNumber: string     // Format: "ORD-2024-XXXXX"
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  items: [
    {
      productId: string
      name: string
      quantity: number
      price: number (snapshot)
      subtotal: number
    }
  ]
  shippingAddress: {
    fullName, phone, street, district, province, postalCode, country
  }
  paymentMethod: string
  paymentStatus: "pending" | "completed" | "failed" | "refunded"
  subtotal: number
  shippingCost: number
  tax: number
  discountAmount: number
  totalAmount: number
  currency: "THB"
  trackingNumber?: string
  timeline: [
    {
      status: string
      timestamp: timestamp
      message?: string
    }
  ]
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 6. Reviews
```typescript
{
  reviewId: string
  productId: string       // FK → products
  userId: string          // FK → users
  orderId: string         // FK → orders
  rating: number (1-5)
  title: string
  comment: string
  images?: string[]
  helpful: number
  unhelpful: number
  verified: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## 🔐 Security Rules Template

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - เฉพาะผู้ใช้เอง
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Products - อ่านได้ทั้งหมด, แต่เขียนแค่ admin
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Carts - เฉพาะของตัวเอง
    match /carts/{cartId} {
      allow read, write: if resource.data.userId == request.auth.uid;
    }
    
    // Whitelists - เฉพาะของตัวเอง
    match /whitelists/{whitelistId} {
      allow read, write: if resource.data.userId == request.auth.uid;
    }
    
    // Orders - อ่านแค่ของตัวเอง
    match /orders/{orderId} {
      allow read: if resource.data.userId == request.auth.uid;
      allow write: if request.auth.token.admin == true;
    }
    
    // Reviews - อ่านทั้งหมด, เขียนได้ถ้า verified user
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 📚 Essential Indexes

สร้าง indexes สำหรับ queries ต่อไปนี้:

```
orders:   userId + createdAt (DESC) - ดึงรายการสั่งซื้อเรียงตามวันที่
orders:   userId + status - ค้นหาตามสถานะ
products: category + price - ค้นหาสินค้าแบบกรอง
products: status + rating (DESC) - หาสินค้า popular
reviews:  productId + rating (DESC) - ดูรีวิวเรียงตามคะแนน
```

Firestore จะแจ้งให้สร้าง indexes โดยอัตโนมัติเมื่อสร้าง query

---

## 🔄 Common Operations

### สร้างผู้ใช้
```typescript
await usersService.createUser(userId, {
  email: "user@example.com",
  username: "john_doe",
  firstName: "John",
  lastName: "Doe",
  role: "customer",
  status: "active"
});
```

### เพิ่มลงตะกร้า
```typescript
await cartsService.addToCart(userId, product, quantity);
```

### เพิ่มลงรายการโปรด
```typescript
await whitelistsService.addToWhitelist(userId, product);
```

### สั่งซื้อ (Transaction)
```typescript
const result = await processOrder(userId, cart, orderData);
const orderId = result.orderId;
```

### ดึงรายการสั่งซื้อ
```typescript
const orders = await ordersService.getUserOrders(userId);
```

### อัพเดตสถานะ
```typescript
await ordersService.updateOrderStatus(orderId, 'shipped');
```

---

## ⚙️ Setup Instructions for React

### 1. Install Firebase
```bash
npm install firebase
```

### 2. Create firebase-config.ts
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MSG_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### 3. Create .env
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MSG_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Use Services in Components
```typescript
import { cartsService, ordersService } from './firestore-service-example';

// In component
const handleAddToCart = async (product) => {
  try {
    await cartsService.addToCart(userId, product, 1);
    // Update UI
  } catch (error) {
    console.error(error);
  }
};
```

---

## 🎯 Pro Tips

1. **Denormalization**: ใส่ข้อมูลสินค้า (ชื่อ, ราคา) ใน order items เพื่อไม่ให้เปลี่ยน
2. **Timestamps**: ใช้ `Timestamp.now()` สำหรับทุก date field
3. **Status Tracking**: ใช้ timeline array เพื่อติดตามการเปลี่ยนแปลง
4. **Soft Deletes**: ใช้ status field แทนลบ documents
5. **Batch Operations**: ใช้ batch writes สำหรับ operations หลาย documents
6. **Transactions**: ใช้ transactions สำหรับ operations ที่เกี่ยวข้องกัน

---

## 📋 Checklist for Implementation

- [ ] Setup Firebase project
- [ ] Configure Firestore database
- [ ] Set security rules
- [ ] Create composite indexes
- [ ] Copy firebase-config.ts
- [ ] Copy firestore-service-example.ts
- [ ] Create React context/state management for cart
- [ ] Implement authentication (Firebase Auth)
- [ ] Build product listing page
- [ ] Build cart page
- [ ] Build checkout page
- [ ] Build order tracking page
- [ ] Add review system

---

## 📞 References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)

---

**Created for React Cart E-Commerce App**
*ออกแบบเพื่อรองรับสเกลและประสิทธิภาพสูง*
