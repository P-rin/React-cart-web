# Frontend Test Context - React Cart Web

## 1) วัตถุประสงค์เอกสาร
เอกสารนี้จัดทำเพื่อเป็น Context การทดสอบฝั่ง Frontend ของโปรเจค React Cart Web สำหรับ Tester/QA โดยครอบคลุม:
- รายละเอียดระบบและขอบเขตงานทดสอบ
- วิธีใช้งานระบบตามบทบาทผู้ใช้
- Spec เชิงหน้าจอและพฤติกรรมที่คาดหวัง (Expected Behavior)
- เงื่อนไขสำคัญที่มีผลต่อการทดสอบ (validation, loading/error state, role guard, stock/order transaction)

เอกสารนี้อิงจากโค้ดจริงในโปรเจค (React + TypeScript + Vite + Firebase Auth + Firestore)

---

## 2) ขอบเขตการทดสอบ (Frontend Scope)

### In Scope
- Authentication UI: Login, Register
- Customer flow: Catalog, Product Detail, Wishlist, Cart, Checkout, Order Success, Orders History, Profile
- Admin flow: Product Management, Orders Management, Sales Report
- State handling ผ่าน React Context: Auth, Product, Cart, Wishlist, Order
- UI states: loading, empty, error, success

### Out of Scope (ในเอกสารนี้)
- Security rules ของ Firestore แบบละเอียดระดับ policy verification
- Performance/load test เชิง backend
- Mobile native app (เอกสารนี้สำหรับ Web frontend)

---



### Role Model
- `customer`: ใช้งาน flow ลูกค้า
- `admin`: ใช้งาน flow ลูกค้า + หน้าผู้ดูแลระบบ

---

## 4) การใช้งานระบบ (Usage Guide)



## 4.3 Demo Flow แนะนำสำหรับ Smoke Test
1. Register ผู้ใช้ใหม่
2. Login
3. เปิด Catalog -> ค้นหา/กรองสินค้า
4. เปิด Product Detail -> เพิ่ม Wishlist -> เพิ่ม Cart
5. ไป Cart -> เพิ่ม/ลดจำนวน
6. ไป Checkout -> กรอกที่อยู่ -> ยืนยันคำสั่งซื้อ
7. ตรวจหน้า Order Success
8. เปิด Orders History -> ตรวจสถานะ/timeline
9. (Admin) เข้า Orders Maintenance -> เปลี่ยนสถานะ order
10. (Admin) เข้า Sales Report -> filter เดือน + export PDF

---

## 5) Functional Spec รายหน้าจอ (Frontend)

## 5.1 Authentication

### Login Page
ข้อมูลที่ใช้เพื่อ Login
user : actprin3@gmail.com
pass : act24070
ไฟล์อ้างอิง: `src/components/auth/LoginPage.tsx`

พฤติกรรมหลัก:
- ต้องกรอก email + password ก่อน submit
- เมื่อ login สำเร็จ ระบบแสดงหน้าหลักที่ผู้ใช้ login แล้ว
- เมื่อ login ไม่สำเร็จ แสดงข้อความ `Login failed. Please check your email and password.`
- ปุ่ม Login อยู่สถานะ disabled ระหว่างกำลัง submit

Test points:
- Required validation
- Error message visibility
- Loading state (`Signing in...`)
- Switch ไป Register Page ได้

### Register Page
ไฟล์อ้างอิง: `src/components/auth/RegisterPage.tsx`

พฤติกรรมหลัก:
- ฟิลด์บังคับ: username, firstName, lastName, email, password
- password ต้องยาวอย่างน้อย 6 ตัว
- confirm password ต้องตรงกับ password
- เมื่อสมัครสำเร็จ จะเข้าสู่สถานะ logged in และสร้าง user profile ใน Firestore

Test points:
- Validation ทุกกรณี
- Error message กรณีสมัครไม่สำเร็จ
- Loading state (`Creating account...`)
- Switch ไป Login Page ได้

---

## 5.2 Customer - Product Catalog
ไฟล์อ้างอิง: `src/pages/customer/ProductListingPage.tsx`, `src/components/products/ProductFilters.tsx`, `src/components/products/ProductCard.tsx`

พฤติกรรมหลัก:
- แสดงรายการสินค้าที่ active
- ค้นหาด้วยชื่อสินค้า (`searchTerm`)
- กรองตาม category
- แสดง loading/error/empty state
- Card แต่ละใบรองรับ:
	- เปิดรายละเอียดสินค้า
	- เพิ่มลง wishlist
	- เพิ่มลง cart (ถ้า stock > 0)

Test points:
- Search + filter ทำงานร่วมกันถูกต้อง
- Out-of-stock แสดงปุ่ม disabled และข้อความ `สินค้าหมด`
- Discount label แสดงเมื่อมี `originalPrice > price`
- กด wishlist toggle แล้วสถานะหัวใจเปลี่ยน

---

## 5.3 Customer - Product Detail
ไฟล์อ้างอิง: `src/pages/customer/ProductDetailPage.tsx`

พฤติกรรมหลัก:
- โหลดข้อมูลสินค้าตาม `productId`
- แสดง gallery รูปภาพ (thumbnail -> image หลัก)
- แสดง description/specifications/ราคา/stock
- ปรับจำนวนสินค้าได้ (quantity)
- เพิ่มลง cart ได้เมื่อจำนวนถูกต้องและไม่เกิน stock
- Toggle wishlist ได้

Validation สำคัญ:
- quantity < 1 -> error
- quantity > stock -> error

Test points:
- loading/error/not-found state
- quantity input กับ stock guard
- ปุ่ม add to cart disabled เมื่อสินค้าไม่มี stock

---

## 5.4 Customer - Wishlist
ไฟล์อ้างอิง: `src/pages/customer/WhitelistPage.tsx`

พฤติกรรมหลัก:
- แสดงรายการโปรดของผู้ใช้ปัจจุบัน
- ลบสินค้าออกจาก wishlist ได้
- แสดง loading/error/empty state

Test points:
- remove item แล้วหายจาก list ทันที
- รายการสุดท้ายถูกลบแล้วกลับเป็น empty state

---

## 5.5 Customer - Cart
ไฟล์อ้างอิง: `src/pages/customer/CartPage.tsx`, `src/components/cart/CartItemRow.tsx`

พฤติกรรมหลัก:
- แสดงรายการสินค้าในตะกร้า
- เพิ่ม/ลดจำนวนสินค้าแต่ละรายการ
- ลบรายการสินค้าออกจากตะกร้า
- สรุป total items + total price
- ไปหน้า Checkout ได้

Behavior สำคัญ:
- มีการ fetch stock ล่าสุดของสินค้าเพื่อตรวจสอบก่อน update quantity
- ปุ่มเพิ่มจำนวน disabled เมื่อชน stock limit
- ลดจำนวนต่ำกว่า 1 ไม่ได้

Test points:
- quantity update และ subtotal update ถูกต้อง
- stock guard ขณะเพิ่มจำนวน
- remove last item แล้วเห็น empty cart state

---

## 5.6 Customer - Checkout
ไฟล์อ้างอิง: `src/pages/customer/CheckoutPage.tsx`

พฤติกรรมหลัก:
- ถ้า cart ว่าง -> แสดงหน้าเตือนว่าไม่มีสินค้าในตะกร้า
- ฟอร์มที่อยู่จัดส่ง prefill จาก profile ผู้ใช้
- รองรับ payment method:
	- bank_transfer
	- credit_card (mock)
	- cash_on_delivery
- คำนวณราคา:
	- `shippingCost = 0` เมื่อ subtotal > 1500, ไม่เช่นนั้น 60
	- `tax = subtotal * 7%`
	- `total = subtotal + shipping + tax - discount`
- Submit สำเร็จ -> ไปหน้า Order Success

Validation สำคัญ:
- ต้องกรอก address fields ครบ
- ปุ่มยืนยัน disabled ถ้า loading หรือข้อมูลไม่ครบ

Test points:
- ตรวจสูตรคำนวณ summary ถูกต้อง
- COD ต้องได้ paymentStatus = pending
- วิธีชำระอื่นได้ paymentStatus = completed
- เมื่อ backend ส่ง error ให้แสดง error message ในฟอร์ม

---

## 5.7 Customer - Order Success
ไฟล์อ้างอิง: `src/pages/customer/OrderSuccessPage.tsx`

พฤติกรรมหลัก:
- แสดง order number และ total amount ที่เพิ่งสั่ง
- มี 2 action:
	- ดูคำสั่งซื้อของฉัน
	- กลับไปเลือกสินค้า

Test points:
- ข้อมูล order summary ตรงกับ checkout result
- ปุ่มนำทางทำงานถูก tab

---

## 5.8 Customer - Orders History
ไฟล์อ้างอิง: `src/pages/customer/OrdersHistoryPage.tsx`, `src/components/orders/OrderTimeline.tsx`

พฤติกรรมหลัก:
- แสดงรายการ order ของ user
- มี tab filter:
	- all
	- to-pay (paymentStatus = pending)
	- to-ship (status in confirmed/processing/shipped)
	- completed (status = delivered)
	- cancelled (status = cancelled)
- เลือก order เพื่อดูรายละเอียดด้านขวา
- ถ้า order ยัง pending สามารถกดยกเลิกได้

Behavior สำคัญ:
- ยกเลิก order ต้องผ่าน confirm dialog
- ยกเลิกสำเร็จแล้วสถานะต้องเปลี่ยนเป็น cancelled และ timeline update

Test points:
- การ map filter ตรงตามเงื่อนไข
- ปุ่ม Cancel แสดงเฉพาะ pending order
- loading/error/empty state ครบ

---

## 5.9 Account - Profile
ไฟล์อ้างอิง: `src/components/account/ProfilePage.tsx`

พฤติกรรมหลัก:
- แสดงข้อมูลบัญชี: name, username, email, status
- แก้ไข phone + address ได้
- บันทึกข้อมูลแล้วขึ้นข้อความสำเร็จ
- Sign out ได้

Test points:
- Load profile สำเร็จ/ไม่สำเร็จ
- Update แล้วข้อมูลใหม่ถูกใช้เป็นค่าเริ่มต้น checkout
- ปุ่ม Sign out กลับสู่ Login/Register flow

---

## 5.10 Admin - Product Management
ไฟล์อ้างอิง: `src/pages/admin/AdminProductManagementPage.tsx`

พฤติกรรมหลัก:
- แสดงรายการสินค้าทั้ง active/inactive
- เพิ่มสินค้าใหม่
- แก้ไขข้อมูลสินค้า
- soft delete (Hide) และ restore
- ปรับ stock แบบ manual (+/-) พร้อม reason

Validation สำคัญ:
- required: name, description, category, sku
- price/stock ต้องไม่ติดลบ
- ต้องมีรูปอย่างน้อย 1 URL

Test points:
- Add/Edit/Clear form
- Hide แล้วสินค้าควรเป็น inactive
- Restore แล้วกลับเป็น active
- stock adjustment ไม่รับค่า 0 และต้องไม่ติดลบหลังปรับ

---

## 5.11 Admin - Orders Management
ไฟล์อ้างอิง: `src/pages/admin/AdminOrderManagementPage.tsx`

พฤติกรรมหลัก:
- เฉพาะ admin เท่านั้นที่เข้าได้
- ดูคำสั่งซื้อทั้งหมด + ค้นหา + กรอง status
- แก้ไข:
	- order status
	- payment status
	- tracking number
	- note ลง timeline
- บันทึกการเปลี่ยนแปลงต่อ order รายตัว

Behavior สำคัญ:
- ถ้าไม่มีการเปลี่ยนแปลง ต้องแจ้ง `No changes to save.`
- การเปลี่ยน status ไป cancelled (จากที่ยังไม่ cancelled) ต้อง trigger การคืน stock ตาม transaction

Test points:
- role guard (non-admin เห็น access denied)
- filter + search accuracy
- save success/fail behavior
- timeline เพิ่มตาม note/status change ถูกต้อง

---

## 5.12 Admin - Sales Report
ไฟล์อ้างอิง: `src/pages/admin/AdminSalesReportPage.tsx`

พฤติกรรมหลัก:
- เฉพาะ admin เท่านั้น
- ดึง orders ทั้งหมดมาคำนวณ metric
- filter รายเดือนด้วย `input type="month"`
- metric สำคัญ:
	- totalOrders
	- completedOrders
	- grossSales
	- refundedAmount
	- netSales
	- averageOrderValue
- export PDF รายงานได้

Test points:
- metric คำนวณถูกต้องเมื่อมี refunded/cancelled orders
- filter เดือนทำงานตรงข้อมูล createdAt
- ปุ่ม Export PDF disabled เมื่อไม่มีข้อมูล

---

## 6) Spec พฤติกรรมข้ามระบบ (Cross-Feature)

## 6.1 Session/Auth
- ตอนเปิดแอป ต้องมีสถานะ `Checking account session...` ระหว่าง `AuthContext.loading`
- ถ้าไม่ login ต้องเห็นเฉพาะ Login/Register
- ถ้า login แล้วต้องเห็น navigation ของผู้ใช้

## 6.2 Role-based Navigation
- customer: Catalog, Profile, Wishlist, Cart, Orders
- admin: เพิ่ม Admin Products และ Sales Report
- ในแท็บ Orders: admin จะเห็น AdminOrderManagementPage, customer จะเห็น OrdersHistoryPage

## 6.3 Order/Stock Consistency
- Place order ต้อง:
	- ตรวจ stock ก่อนตัด
	- ตัด stock แบบ transaction
	- สร้าง order
	- ลบ cart
- Cancel order (ลูกค้า/admin) ต้องคืน stock เฉพาะ transition ที่ถูกต้อง

## 6.4 Error Handling Standard
- หน้าหลักทุกโมดูลควรแสดง error message เมื่อ action ล้มเหลว
- ปุ่มที่ trigger async action ควรมี disabled/loading state

---

## 7) Test Data Matrix (ขั้นต่ำ)

ควรเตรียมสินค้า:
- Product A: stock = 10, active
- Product B: stock = 1, active
- Product C: stock = 0, active
- Product D: inactive

ควรเตรียม order สถานะต่าง ๆ:
- pending
- confirmed/processing/shipped
- delivered
- cancelled
- refunded

---

## 8) Acceptance Checklist (Frontend)
- Auth flow ผ่านครบ login/register/signout
- Catalog search/filter/card actions ถูกต้อง
- Product detail validation quantity ถูกต้อง
- Wishlist add/remove ถูกต้อง
- Cart quantity/stock guard/summary ถูกต้อง
- Checkout validation + price summary + order creation flow ถูกต้อง
- Order success/Order history/Cancel pending ทำงานถูกต้อง
- Profile update สะท้อนไป checkout ได้
- Admin product/order/sales features ใช้งานได้ตามสิทธิ์
- Loading/Empty/Error states แสดงครบทุกหน้าหลัก

---

## 9) หมายเหตุสำหรับ Tester
- ระบบนี้ใช้ Firestore transaction ใน flow สำคัญ (checkout, cancel order, admin update บางกรณี) ดังนั้นหากทดสอบแล้วพฤติกรรมไม่ตรง ให้ตรวจทั้ง UI และข้อมูลใน Firestore ควบคู่
- การทดสอบ role ต้องอิงค่าจาก user profile (`users/{uid}.role`)
- สำหรับการทดสอบ PDF export ให้ตรวจทั้งการดาวน์โหลดไฟล์และความถูกต้องของตารางภายในไฟล์

