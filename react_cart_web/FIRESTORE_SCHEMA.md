# 📊 Firestore Database Schema - E-Commerce App

## 📋 Overview
โครงสร้างฐานข้อมูล Firestore สำหรับแอปพลิเคชัน E-Commerce ที่รองรับ Users, Products, Cart, Whitelist และ Orders

---

## 1️⃣ Collection: `users`
**คำอธิบาย**: เก็บข้อมูลผู้ใช้งาน

```json
{
  "users": {
    "userId1": {
      "userId": "userId1",
      "email": "user@example.com",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "0891234567",
      "profileImage": "https://example.com/image.jpg",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-05-16T14:20:00Z",
      "address": {
        "street": "123 Main St",
        "district": "Watthana",
        "province": "Bangkok",
        "postalCode": "10110",
        "country": "Thailand"
      },
      "role": "customer",
      "status": "active",
      "preferences": {
        "currency": "THB",
        "language": "th",
        "notifications": true
      }
    }
  }
}
```

**ฟิลด์สำคัญ**:
- `userId`: ID ผู้ใช้ (Primary Key - ใช้ Firebase Auth UID)
- `email`: อีเมล (unique)
- `address`: ที่อยู่สำหรับจัดส่ง
- `role`: ประเภทผู้ใช้ (customer, admin)
- `status`: สถานะ (active, suspended, inactive)

---

## 2️⃣ Collection: `products`
**คำอธิบาย**: เก็บข้อมูลสินค้า

```json
{
  "products": {
    "product1": {
      "productId": "product1",
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone with advanced features",
      "category": "Electronics",
      "subcategory": "Smartphones",
      "price": 49999,
      "originalPrice": 59999,
      "currency": "THB",
      "stock": 150,
      "status": "active",
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
        "https://example.com/image3.jpg"
      ],
      "specifications": {
        "brand": "Apple",
        "color": "Black",
        "storage": "256GB",
        "processor": "A17 Pro"
      },
      "rating": 4.8,
      "reviewCount": 245,
      "tags": ["smartphone", "latest", "premium"],
      "sku": "IPHONE15PRO-BLK-256",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-05-16T12:00:00Z",
      "supplier": "Supplier123"
    }
  }
}
```

**ฟิลด์สำคัญ**:
- `productId`: ID สินค้า (Primary Key)
- `price/originalPrice`: ราคาปัจจุบัน/ราคาเดิม
- `stock`: จำนวนสินค้าในคลังเก็บ
- `category/subcategory`: หมวดหมู่
- `specifications`: ข้อมูลรายละเอียด
- `rating`: คะแนน (อพเดตจาก orders collection)

---

## 3️⃣ Collection: `carts`
**คำอธิบาย**: เก็บข้อมูลตะกร้าสินค้า (Sub-collection ของ users)

```json
{
  "users": {
    "userId1": {
      "carts": {
        "cartItems": {
          "cartId": "cart_userId1",
          "userId": "userId1",
          "items": [
            {
              "productId": "product1",
              "name": "iPhone 15 Pro",
              "price": 49999,
              "quantity": 1,
              "image": "https://example.com/image1.jpg",
              "specifications": {
                "color": "Black",
                "storage": "256GB"
              },
              "addedAt": "2024-05-16T10:00:00Z",
              "subtotal": 49999
            },
            {
              "productId": "product2",
              "name": "AirPods Pro",
              "price": 12999,
              "quantity": 2,
              "image": "https://example.com/image2.jpg",
              "subtotal": 25998
            }
          ],
          "totalItems": 3,
          "totalPrice": 75997,
          "lastUpdated": "2024-05-16T14:30:00Z"
        }
      }
    }
  }
}
```

**หรือ Collection แยก: `carts`**:

```json
{
  "carts": {
    "cart_userId1": {
      "cartId": "cart_userId1",
      "userId": "userId1",
      "items": [
        {
          "productId": "product1",
          "quantity": 1,
          "price": 49999,
          "addedAt": "2024-05-16T10:00:00Z"
        }
      ],
      "totalItems": 1,
      "totalPrice": 49999,
      "lastUpdated": "2024-05-16T14:30:00Z"
    }
  }
}
```

**ฟิลด์สำคัญ**:
- `cartId`: ID ตะกร้า (Primary Key)
- `userId`: ID ผู้ใช้ (Foreign Key → users)
- `items`: Array ของสินค้า
  - `productId`: อ้างอิงถึง products
  - `quantity`: จำนวนสินค้า
  - `price`: ราคา (snapshot เวลาเพิ่มลงตะกร้า)
- `totalPrice`: ยอดรวม

---

## 4️⃣ Collection: `whitelists` (Wishlist/Favorites)
**คำอธิบาย**: เก็บรายการสินค้าที่ชอบ

```json
{
  "whitelists": {
    "wishlist_userId1": {
      "whitelistId": "wishlist_userId1",
      "userId": "userId1",
      "items": [
        {
          "productId": "product3",
          "name": "MacBook Pro",
          "price": 89999,
          "image": "https://example.com/image3.jpg",
          "addedAt": "2024-05-10T15:00:00Z",
          "notes": "Want to buy this"
        },
        {
          "productId": "product4",
          "name": "iPad Air",
          "price": 34999,
          "image": "https://example.com/image4.jpg",
          "addedAt": "2024-05-12T11:30:00Z"
        }
      ],
      "totalItems": 2,
      "createdAt": "2024-01-01T08:00:00Z",
      "updatedAt": "2024-05-16T14:30:00Z"
    }
  }
}
```

**ฟิลด์สำคัญ**:
- `whitelistId`: ID รายการโปรด (Primary Key)
- `userId`: ID ผู้ใช้ (Foreign Key → users)
- `items`: Array ของสินค้าโปรด
  - `productId`: อ้างอิงถึง products
  - `notes`: หมายเหตุส่วนตัว
- `totalItems`: จำนวนสินค้าในรายการโปรด

---

## 5️⃣ Collection: `orders`
**คำอธิบาย**: เก็บข้อมูลรายการสั่งซื้อ

```json
{
  "orders": {
    "order_001": {
      "orderId": "order_001",
      "userId": "userId1",
      "orderNumber": "ORD-2024-0515-001",
      "status": "shipped",
      "items": [
        {
          "productId": "product1",
          "name": "iPhone 15 Pro",
          "quantity": 1,
          "price": 49999,
          "subtotal": 49999,
          "specifications": {
            "color": "Black",
            "storage": "256GB"
          }
        },
        {
          "productId": "product2",
          "name": "AirPods Pro",
          "quantity": 2,
          "price": 12999,
          "subtotal": 25998
        }
      ],
      "shippingAddress": {
        "fullName": "John Doe",
        "phone": "0891234567",
        "street": "123 Main St",
        "district": "Watthana",
        "province": "Bangkok",
        "postalCode": "10110",
        "country": "Thailand"
      },
      "paymentMethod": "credit_card",
      "paymentStatus": "completed",
      "subtotal": 75997,
      "shippingCost": 200,
      "tax": 7600,
      "discountCode": "SAVE20",
      "discountAmount": 15199,
      "totalAmount": 68598,
      "currency": "THB",
      "notes": "Please deliver after 6 PM",
      "trackingNumber": "TH123456789",
      "createdAt": "2024-05-15T10:30:00Z",
      "updatedAt": "2024-05-16T14:30:00Z",
      "estimatedDelivery": "2024-05-20T23:59:59Z",
      "timeline": [
        {
          "status": "pending",
          "timestamp": "2024-05-15T10:30:00Z"
        },
        {
          "status": "confirmed",
          "timestamp": "2024-05-15T11:00:00Z"
        },
        {
          "status": "shipped",
          "timestamp": "2024-05-16T08:00:00Z"
        }
      ]
    }
  }
}
```

**ฟิลด์สำคัญ**:
- `orderId`: ID รายการสั่งซื้อ (Primary Key)
- `userId`: ID ผู้ใช้ (Foreign Key → users)
- `orderNumber`: หมายเลขรายการสั่งซื้อ (readable format)
- `status`: สถานะ (pending, confirmed, processing, shipped, delivered, cancelled)
- `items`: Array ของสินค้าในรายการสั่งซื้อ
- `shippingAddress`: ที่อยู่สำหรับจัดส่ง
- `paymentStatus`: สถานะการชำระเงิน (pending, completed, failed, refunded)
- `timeline`: ประวัติการเปลี่ยนแปลงสถานะ

---

## 6️⃣ Collection (Optional): `reviews`
**คำอธิบาย**: เก็บรีวิวและเรตติ้งสินค้า

```json
{
  "reviews": {
    "review_001": {
      "reviewId": "review_001",
      "productId": "product1",
      "userId": "userId1",
      "orderId": "order_001",
      "rating": 5,
      "title": "Amazing product!",
      "comment": "Excellent quality and fast delivery",
      "images": ["https://example.com/review1.jpg"],
      "helpful": 45,
      "unhelpful": 2,
      "createdAt": "2024-05-18T10:00:00Z",
      "updatedAt": "2024-05-18T10:00:00Z",
      "verified": true
    }
  }
}
```

---

## 7️⃣ Collection (Optional): `categories`
**คำอธิบาย**: เก็บข้อมูลหมวดหมู่สินค้า

```json
{
  "categories": {
    "cat_electronics": {
      "categoryId": "cat_electronics",
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "image": "https://example.com/cat-electronics.jpg",
      "icon": "📱",
      "subcategories": [
        "Smartphones",
        "Laptops",
        "Accessories"
      ],
      "order": 1,
      "active": true
    }
  }
}
```

---

## 📊 Firestore Structure - ภาพรวม

```
firestore_root/
├── users/ (Collection)
│   └── userId1/ (Document)
│       ├── email
│       ├── username
│       ├── address
│       └── carts/ (Sub-collection - Optional)
│           └── cartItems/ (Document)
│
├── products/ (Collection)
│   └── product1/ (Document)
│       ├── name
│       ├── price
│       ├── stock
│       └── specifications
│
├── carts/ (Collection - Standalone)
│   └── cart_userId1/ (Document)
│       ├── userId (FK → users)
│       └── items[]
│
├── whitelists/ (Collection)
│   └── wishlist_userId1/ (Document)
│       ├── userId (FK → users)
│       └── items[]
│
├── orders/ (Collection)
│   └── order_001/ (Document)
│       ├── userId (FK → users)
│       ├── items[] (with productId FK → products)
│       └── timeline[]
│
├── reviews/ (Collection - Optional)
│   └── review_001/ (Document)
│       ├── productId (FK → products)
│       ├── userId (FK → users)
│       └── orderId (FK → orders)
│
└── categories/ (Collection - Optional)
    └── cat_electronics/ (Document)
```

---

## 🔗 Data Relationships

### Primary Keys & Foreign Keys

| Collection | Primary Key | Foreign Keys |
|-----------|------------|--------------|
| users | userId | - |
| products | productId | - |
| carts | cartId | userId → users |
| whitelists | whitelistId | userId → users |
| orders | orderId | userId → users, productId → products (in items) |
| reviews | reviewId | productId → products, userId → users, orderId → orders |
| categories | categoryId | - |

### Relationship Diagram

```
users (1) ──────→ (many) carts
  │
  ├───────────→ (many) whitelists
  │
  └───────────→ (many) orders ──────→ (many) products
                        │
                        └───────────→ (many) reviews ──→ products
```

---

## 🔐 Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwnerByData(data) {
      return isSignedIn() && data.userId == request.auth.uid;
    }

    function isOwnerCartId(cartId) {
      return isSignedIn() && cartId == ('cart_' + request.auth.uid);
    }

    function isOwnerWishlistId(whitelistId) {
      return isSignedIn() && whitelistId == ('wishlist_' + request.auth.uid);
    }

    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    
    // Anyone can read products
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth.token.admin == true;
    }
    
    // Users can only access their own cart
    match /carts/{cartId} {
      allow get: if isOwnerCartId(cartId);
      allow list: if false;
      allow create: if isOwnerCartId(cartId)
                    && isOwnerByData(request.resource.data)
                    && request.resource.data.cartId == cartId;
      allow update: if isOwnerCartId(cartId)
                    && isOwnerByData(resource.data)
                    && request.resource.data.userId == resource.data.userId
                    && request.resource.data.cartId == resource.data.cartId;
      allow delete: if isOwnerCartId(cartId) && isOwnerByData(resource.data);
    }
    
    // Users can only access their own whitelist
    match /whitelists/{whitelistId} {
      allow get: if isOwnerWishlistId(whitelistId);
      allow list: if false;
      allow create: if isOwnerWishlistId(whitelistId)
                    && isOwnerByData(request.resource.data)
                    && request.resource.data.whitelistId == whitelistId;
      allow update: if isOwnerWishlistId(whitelistId)
                    && isOwnerByData(resource.data)
                    && request.resource.data.userId == resource.data.userId
                    && request.resource.data.whitelistId == resource.data.whitelistId;
      allow delete: if isOwnerWishlistId(whitelistId) && isOwnerByData(resource.data);
    }
    
    // Users can only read their own orders
    match /orders/{orderId} {
      allow read: if resource.data.userId == request.auth.uid;
      allow write: if request.auth.token.admin == true;
    }
    
    // Anyone can read reviews
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 📋 Indexing Strategy

### ต้องสร้าง Composite Indexes:

1. **orders**: `userId + createdAt` (ดูเรียงลำดับรายการสั่งซื้อ)
2. **orders**: `userId + status` (ค้นหาตามสถานะ)
3. **products**: `category + price` (ค้นหาสินค้า)
4. **products**: `status + rating` (ค้นหาสินค้า popular)
5. **reviews**: `productId + rating` (ดูรีวิวสินค้า)

---

## ✅ Best Practices

1. **Denormalization**: เก็บข้อมูลพื้นฐาน (ชื่อ, ราคา) ใน orders items เพื่อไม่ให้ข้อมูลเปลี่ยนแปลง
2. **Sub-collections vs Top-level**: ใช้ Sub-collection สำหรับข้อมูลที่เล็ก (carts), Top-level สำหรับข้อมูลที่ต้องค้นหามาก
3. **Timestamps**: ใช้ `createdAt` และ `updatedAt` สำหรับทุก document
4. **Status Tracking**: ใช้ `timeline` array เพื่อติดตามการเปลี่ยนแปลง
5. **Soft Deletes**: ใช้ `status` field แทนการลบ document จริง

---

## 🎯 Implementation Tips for React + Firebase

```typescript
// Example Firestore Service
import { collection, doc, setDoc, getDoc, updateDoc, query, where } from 'firebase/firestore';

// Get user data
const getUserData = async (userId: string) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.data();
};

// Add to cart
const addToCart = async (userId: string, product: any) => {
  const cartRef = doc(db, 'carts', `cart_${userId}`);
  // Update logic...
};

// Get user orders
const getUserOrders = async (userId: string) => {
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  // Query logic...
};
```

---

## 📝 Notes

- ใช้ `userId` จาก Firebase Authentication
- ควรสร้าง **indexes** ให้กับ queries ที่ใช้บ่อย
- พิจารณาใช้ **transaction** สำหรับ operations ที่เกี่ยวข้องหลายๆ documents (เช่น สั่งซื้อ)
- ใช้ **batch writes** สำหรับ update หลายๆ documents พร้อมกัน
