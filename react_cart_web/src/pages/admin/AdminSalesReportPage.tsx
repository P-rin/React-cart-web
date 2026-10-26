import { useCallback, useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../../contexts/AuthContext'
import { ordersService, type OrderDoc } from '../../services/firestore-service'
import { getOrderStatusLabel, getPaymentStatusLabel } from '../../utils/localization'

type SalesMetrics = {
  totalOrders: number
  completedOrders: number
  grossSales: number
  refundedAmount: number
  netSales: number
  averageOrderValue: number
}

function toDate(value: unknown): Date | null {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const candidate = value as { toDate?: () => Date }
    if (typeof candidate.toDate === 'function') {
      return candidate.toDate()
    }
  }

  return null
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const index = Number(month) - 1
  const date = new Date(Number(year), index, 1)
  return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
}

function isCompletedSale(order: OrderDoc): boolean {
  const isRefunded = order.status === 'refunded' || order.paymentStatus === 'refunded'
  const isCancelled = order.status === 'cancelled'
  return order.paymentStatus === 'completed' && !isRefunded && !isCancelled
}

export default function AdminSalesReportPage() {
  const { role } = useAuth()
  const [orders, setOrders] = useState<OrderDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [monthFilter, setMonthFilter] = useState('')

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await ordersService.getAllOrders()
      setOrders(data)
    } catch {
      setError('โหลดรายงานยอดขายไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (role !== 'admin') {
      return
    }
    void fetchOrders()
  }, [fetchOrders, role])

  const monthOptions = useMemo(() => {
    const uniqueMonths = new Set<string>()
    orders.forEach((order) => {
      const date = toDate(order.createdAt)
      if (date) {
        uniqueMonths.add(toMonthKey(date))
      }
    })

    return [...uniqueMonths].sort((left, right) => right.localeCompare(left))
  }, [orders])

  const filteredOrders = useMemo(() => {
    if (!monthFilter) {
      return orders
    }

    return orders.filter((order) => {
      const createdAt = toDate(order.createdAt)
      return createdAt ? toMonthKey(createdAt) === monthFilter : false
    })
  }, [monthFilter, orders])

  const metrics = useMemo<SalesMetrics>(() => {
    const completedOrders = filteredOrders.filter((order) => isCompletedSale(order))
    const refundedAmount = filteredOrders
      .filter((order) => order.status === 'refunded' || order.paymentStatus === 'refunded')
      .reduce((sum, order) => sum + order.totalAmount, 0)

    const grossSales = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const netSales = Math.max(grossSales - refundedAmount, 0)

    return {
      totalOrders: filteredOrders.length,
      completedOrders: completedOrders.length,
      grossSales,
      refundedAmount,
      netSales,
      averageOrderValue: completedOrders.length > 0 ? grossSales / completedOrders.length : 0,
    }
  }, [filteredOrders])

  const handleExportPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const title = 'Sales Summary Report'
    const subtitle = monthFilter ? `Month: ${formatMonthLabel(monthFilter)}` : 'Month: All'

    doc.setFontSize(18)
    doc.text(title, 40, 46)
    doc.setFontSize(11)
    doc.text(subtitle, 40, 66)
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 40, 82)

    doc.setFontSize(12)
    doc.text(`Total Orders: ${metrics.totalOrders}`, 40, 114)
    doc.text(`Completed Orders: ${metrics.completedOrders}`, 40, 132)
    doc.text(`Gross Sales: ${formatCurrency(metrics.grossSales)}`, 40, 150)
    doc.text(`Refunded: ${formatCurrency(metrics.refundedAmount)}`, 40, 168)
    doc.text(`Net Sales: ${formatCurrency(metrics.netSales)}`, 40, 186)
    doc.text(`Average Order Value: ${formatCurrency(metrics.averageOrderValue)}`, 40, 204)

    autoTable(doc, {
      startY: 226,
      head: [['Order No', 'Date', 'Customer', 'Status', 'Payment', 'Total (THB)']],
      body: filteredOrders.map((order) => {
        const date = toDate(order.createdAt)
        return [
          order.orderNumber,
          date ? date.toLocaleDateString('en-GB') : '-',
          order.shippingAddress.fullName,
          order.status,
          order.paymentStatus,
          order.totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        ]
      }),
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [15, 118, 110],
      },
      columnStyles: {
        5: { halign: 'right' },
      },
    })

    const suffix = monthFilter || 'all-months'
    doc.save(`sales-report-${suffix}.pdf`)
  }

  if (role !== 'admin') {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">รายงานยอดขาย</h1>
        <p className="mt-2 text-sm text-rose-600">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">สรุปรายงานยอดขาย</h1>
          <p className="text-sm text-slate-600">ดูยอดขายรายเดือน และส่งออกรายงานเป็น PDF</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-slate-700">
            <span className="mr-2">เลือกเดือน</span>
            <input
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
              list="sales-month-options"
              className="rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>

          <datalist id="sales-month-options">
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </datalist>

          <button
            type="button"
            onClick={() => setMonthFilter('')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
          >
            ล้างตัวกรอง
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={filteredOrders.length === 0}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            ส่งออกรายงาน PDF
          </button>

          <button
            type="button"
            onClick={() => void fetchOrders()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
          >
            โหลดข้อมูลใหม่
          </button>
        </div>
      </div>

      {loading ? <p className="text-slate-700">กำลังโหลดรายงาน...</p> : null}
      {error ? <p className="text-rose-600">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">คำสั่งซื้อทั้งหมด</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{metrics.totalOrders}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">ยอดขายรวม</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{formatCurrency(metrics.grossSales)}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">ยอดขายสุทธิ</p>
          <p className="mt-1 text-2xl font-semibold text-cyan-700">{formatCurrency(metrics.netSales)}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">คำสั่งซื้อที่สำเร็จ</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{metrics.completedOrders}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">ยอดเงินที่คืน</p>
          <p className="mt-1 text-2xl font-semibold text-rose-700">{formatCurrency(metrics.refundedAmount)}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">ยอดสั่งซื้อเฉลี่ย</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(metrics.averageOrderValue)}</p>
        </article>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  เลขที่คำสั่งซื้อ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  วันที่
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  ลูกค้า
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  สถานะ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  การชำระเงิน
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  ยอดรวม
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    ไม่พบคำสั่งซื้อในเดือนที่เลือก
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const createdAt = toDate(order.createdAt)
                  return (
                    <tr key={order.orderId}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {createdAt ? createdAt.toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{order.shippingAddress.fullName}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{getOrderStatusLabel(order.status)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{getPaymentStatusLabel(order.paymentStatus)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
