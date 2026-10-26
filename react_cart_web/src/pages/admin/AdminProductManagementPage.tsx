import { useEffect, useMemo, useState } from 'react'
import { useProducts } from '../../contexts/ProductContext'
import { useAuth } from '../../contexts/AuthContext'
import type { Product, ProductInput } from '../../services/firestore-service'
import { getProductStatusLabel } from '../../utils/localization'

const initialForm: ProductInput = {
  name: '',
  description: '',
  category: '',
  subcategory: '',
  price: 0,
  originalPrice: undefined,
  stock: 0,
  sku: '',
  status: 'active',
  images: [''],
  specifications: {},
  tags: [],
  supplier: '',
}

export default function AdminProductManagementPage() {
  const {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    softDeleteProduct,
    restoreProduct,
    adjustProductStock,
  } = useProducts()
  const { currentUser } = useAuth()
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductInput>(initialForm)
  const [specText, setSpecText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [stockAdjustments, setStockAdjustments] = useState<Record<string, { delta: string; reason: string }>>({})

  useEffect(() => {
    void fetchProducts({ includeInactive: true })
  }, [fetchProducts])

  const heading = useMemo(() => (editingProductId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'), [editingProductId])

  const handleEdit = (product: Product) => {
    setEditingProductId(product.productId)
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      sku: product.sku,
      status: product.status,
      images: product.images.length ? product.images : [''],
      specifications: product.specifications,
      tags: product.tags,
      supplier: product.supplier,
    })
    const serializedSpecs = Object.entries(product.specifications || {})
      .map(([key, value]) => `${key}:${value}`)
      .join('\n')
    setSpecText(serializedSpecs)
  }

  const resetForm = () => {
    setEditingProductId(null)
    setForm(initialForm)
    setSpecText('')
  }

  const handleImageChange = (index: number, value: string) => {
    const next = [...form.images]
    next[index] = value
    setForm((prev) => ({ ...prev, images: next }))
  }

  const addImageField = () => {
    setForm((prev) => ({ ...prev, images: [...prev.images, ''] }))
  }

  const removeImageField = (index: number) => {
    if (form.images.length <= 1) {
      return
    }
    const next = form.images.filter((_, current) => current !== index)
    setForm((prev) => ({ ...prev, images: next }))
  }

  const parseSpecs = () => {
    const lines = specText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    const specs: Record<string, string> = {}
    lines.forEach((line) => {
      const [key, ...rest] = line.split(':')
      if (!key || rest.length === 0) {
        return
      }
      specs[key.trim()] = rest.join(':').trim()
    })

    return specs
  }

  const validate = () => {
    if (!form.name || !form.description || !form.category || !form.sku) {
      return 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'
    }
    if (form.price < 0 || form.stock < 0) {
      return 'ราคาและจำนวนสินค้าคงเหลือต้องไม่ต่ำกว่า 0'
    }
    if (!form.images.filter((item) => item.trim()).length) {
      return 'กรุณาระบุ URL รูปภาพอย่างน้อย 1 รูป'
    }
    return ''
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      alert(validationError)
      return
    }

    const payload: ProductInput = {
      ...form,
      images: form.images.map((item) => item.trim()).filter(Boolean),
      specifications: parseSpecs(),
    }

    try {
      setSubmitting(true)
      if (editingProductId) {
        await updateProduct(editingProductId, payload)
      } else {
        await createProduct(payload)
      }
      resetForm()
      await fetchProducts({ includeInactive: true })
    } finally {
      setSubmitting(false)
    }
  }

  const getAdjustmentDraft = (productId: string) => {
    return stockAdjustments[productId] ?? { delta: '', reason: '' }
  }

  const updateAdjustmentDraft = (
    productId: string,
    field: 'delta' | 'reason',
    value: string,
  ) => {
    setStockAdjustments((prev) => ({
      ...prev,
      [productId]: {
        ...getAdjustmentDraft(productId),
        [field]: value,
      },
    }))
  }

  const handleAdjustStock = async (product: Product) => {
    const draft = getAdjustmentDraft(product.productId)
    const delta = Number(draft.delta)

    if (!Number.isFinite(delta) || delta === 0) {
      alert('กรุณาระบุจำนวนสินค้าที่ต้องการปรับ โดยต้องไม่เป็น 0')
      return
    }

    try {
      await adjustProductStock({
        productId: product.productId,
        adjustment: Math.trunc(delta),
        reason: draft.reason,
        actor: {
          userId: currentUser?.uid,
          email: currentUser?.email ?? undefined,
        },
      })

      setStockAdjustments((prev) => ({
        ...prev,
        [product.productId]: { delta: '', reason: '' },
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ปรับจำนวนสินค้าไม่สำเร็จ'
      alert(message)
    }
  }

  const handleSoftDelete = async (product: Product) => {
    const confirmed = window.confirm(`ซ่อนสินค้า "${product.name}" จากหน้าร้านใช่หรือไม่?`)
    if (!confirmed) {
      return
    }
    try {
      await softDeleteProduct(product.productId)
    } catch {
      alert('ซ่อนสินค้าไม่สำเร็จ')
    }
  }

  const handleRestore = async (product: Product) => {
    try {
      await restoreProduct(product.productId)
    } catch {
      alert('กู้คืนสินค้าไม่สำเร็จ')
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">รายการสินค้า</h2>
        <p className="mt-1 text-sm text-slate-600">เลือกสินค้าเพื่อแก้ไข หรือเพิ่มสินค้าใหม่</p>

        {loading ? <p className="mt-4 text-slate-700">กำลังโหลดสินค้า...</p> : null}
        {error ? <p className="mt-4 text-red-600">{error}</p> : null}

        <div className="mt-4 space-y-3">
          {products.map((product) => (
            <div
              key={product.productId}
              className="rounded-xl border border-slate-200 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    รหัสสินค้า: {product.sku} | คงเหลือ: {product.stock}
                  </p>
                  <p className="text-xs text-slate-500">สถานะ: {getProductStatusLabel(product.status)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
                  >
                    แก้ไข
                  </button>
                  {product.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => void handleSoftDelete(product)}
                      className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
                    >
                      ซ่อน
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleRestore(product)}
                      className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      กู้คืน
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[120px_1fr_auto]">
                <input
                  type="number"
                  value={getAdjustmentDraft(product.productId).delta}
                  onChange={(event) =>
                    updateAdjustmentDraft(product.productId, 'delta', event.target.value)
                  }
                  placeholder="+/- จำนวนสินค้า"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={getAdjustmentDraft(product.productId).reason}
                  onChange={(event) =>
                    updateAdjustmentDraft(product.productId, 'reason', event.target.value)
                  }
                  placeholder="เหตุผล (ไม่บังคับ)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleAdjustStock(product)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
                >
                  ปรับจำนวน
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{heading}</h2>
          {editingProductId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
            >
              ล้างข้อมูล
            </button>
          ) : null}
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            placeholder="ชื่อสินค้า*"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          />
          <textarea
            placeholder="รายละเอียดสินค้า*"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="หมวดหมู่*"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              placeholder="หมวดหมู่ย่อย"
              value={form.subcategory}
              onChange={(event) => setForm((prev) => ({ ...prev, subcategory: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              type="number"
              placeholder="ราคา*"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              type="number"
              placeholder="ราคาเดิม"
              value={form.originalPrice ?? ''}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  originalPrice: event.target.value ? Number(event.target.value) : undefined,
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              type="number"
              placeholder="จำนวนสินค้าคงเหลือ*"
              value={form.stock}
              onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              placeholder="รหัสสินค้า*"
              value={form.sku}
              onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <select
              value={form.status ?? 'active'}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as ProductInput['status'],
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            >
              <option value="active">พร้อมจำหน่าย</option>
              <option value="inactive">ปิดใช้งาน</option>
              <option value="discontinued">เลิกจำหน่าย</option>
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">URL รูปภาพ*</p>
            {form.images.map((image, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={image}
                  onChange={(event) => handleImageChange(index, event.target.value)}
                  placeholder={`URL รูปภาพ ${index + 1}`}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                />
                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="rounded-xl border border-slate-300 px-3 text-sm"
                >
                  ลบ
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addImageField}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              + เพิ่ม URL รูปภาพ
            </button>
          </div>

          <textarea
            value={specText}
            onChange={(event) => setSpecText(event.target.value)}
            placeholder="รายละเอียดสินค้า (บรรทัดละรายการ) เช่น สี:ดำ"
            className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-600 disabled:opacity-70"
          >
            {submitting ? 'กำลังบันทึก...' : editingProductId ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}
          </button>
        </form>
      </article>
    </section>
  )
}
