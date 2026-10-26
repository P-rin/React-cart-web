import type {
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from '../services/firestore-service'

const orderStatusLabels: Record<string, string> = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  processing: 'กำลังเตรียมสินค้า',
  shipped: 'จัดส่งแล้ว',
  delivered: 'จัดส่งสำเร็จ',
  cancelled: 'ยกเลิกแล้ว',
  refunded: 'คืนเงินแล้ว',
}

const paymentStatusLabels: Record<string, string> = {
  pending: 'รอชำระเงิน',
  completed: 'ชำระเงินแล้ว',
  failed: 'ชำระเงินไม่สำเร็จ',
  refunded: 'คืนเงินแล้ว',
}

const productStatusLabels: Record<string, string> = {
  active: 'พร้อมจำหน่าย',
  inactive: 'ปิดใช้งาน',
  discontinued: 'เลิกจำหน่าย',
}

const categoryLabels: Record<string, string> = {
  Electronics: 'อุปกรณ์อิเล็กทรอนิกส์',
  Gaming: 'เกมมิ่ง',
  Furniture: 'เฟอร์นิเจอร์',
  Smartphones: 'สมาร์ตโฟน',
  Laptops: 'แล็ปท็อป',
  Accessories: 'อุปกรณ์เสริม',
  Office: 'สำนักงาน',
  Uncategorized: 'ไม่มีหมวดหมู่',
}

const specificationLabels: Record<string, string> = {
  brand: 'แบรนด์',
  storage: 'พื้นที่จัดเก็บ',
  cpu: 'หน่วยประมวลผล',
  ram: 'แรม',
  display: 'หน้าจอ',
  color: 'สี',
  chip: 'ชิป',
  connectivity: 'การเชื่อมต่อ',
  battery: 'แบตเตอรี่',
  noiseCancellation: 'ระบบตัดเสียงรบกวน',
  dpi: 'ความละเอียดเซนเซอร์',
  switches: 'สวิตช์',
  connection: 'การเชื่อมต่อ',
  material: 'วัสดุ',
  maxLoad: 'รองรับน้ำหนักสูงสุด',
  warranty: 'การรับประกัน',
}

export function getOrderStatusLabel(status: OrderStatus | string): string {
  return orderStatusLabels[status] ?? status
}

export function getPaymentStatusLabel(status: PaymentStatus | string): string {
  return paymentStatusLabels[status] ?? status
}

export function getProductStatusLabel(status: ProductStatus | string): string {
  return productStatusLabels[status] ?? status
}

export function getAccountStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'ใช้งานอยู่',
    suspended: 'ระงับการใช้งาน',
    inactive: 'ไม่ได้ใช้งาน',
  }
  return labels[status] ?? status
}

export function getCategoryLabel(category: string): string {
  return categoryLabels[category] ?? category
}

export function getSpecificationLabel(key: string): string {
  return specificationLabels[key] ?? key
}
