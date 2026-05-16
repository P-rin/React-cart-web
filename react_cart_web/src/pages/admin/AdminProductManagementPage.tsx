import { useEffect, useMemo, useState } from 'react'
import { useProducts } from '../../contexts/ProductContext'
import type { Product, ProductInput } from '../../services/firestore-service'

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
  const { products, loading, error, fetchProducts, createProduct, updateProduct } = useProducts()
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductInput>(initialForm)
  const [specText, setSpecText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void fetchProducts({ includeInactive: true })
  }, [fetchProducts])

  const heading = useMemo(() => (editingProductId ? 'Edit Product' : 'Add Product'), [editingProductId])

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
      return 'Please fill all required fields.'
    }
    if (form.price < 0 || form.stock < 0) {
      return 'Price and stock must be zero or greater.'
    }
    if (!form.images.filter((item) => item.trim()).length) {
      return 'Please provide at least one image URL.'
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
      status: 'active',
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

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Products</h2>
        <p className="mt-1 text-sm text-slate-600">เลือกสินค้าเพื่อแก้ไข หรือเพิ่มสินค้าใหม่</p>

        {loading ? <p className="mt-4 text-slate-700">Loading products...</p> : null}
        {error ? <p className="mt-4 text-red-600">{error}</p> : null}

        <div className="mt-4 space-y-3">
          {products.map((product) => (
            <div
              key={product.productId}
              className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">{product.name}</p>
                <p className="text-xs text-slate-500">
                  SKU: {product.sku} | Stock: {product.stock}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleEdit(product)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              >
                Edit
              </button>
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
              Clear
            </button>
          ) : null}
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            placeholder="Name*"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
          />
          <textarea
            placeholder="Description*"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Category*"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              placeholder="Subcategory"
              value={form.subcategory}
              onChange={(event) => setForm((prev) => ({ ...prev, subcategory: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              type="number"
              placeholder="Price*"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value) }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              type="number"
              placeholder="Original Price"
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
              placeholder="Stock*"
              value={form.stock}
              onChange={(event) => setForm((prev) => ({ ...prev, stock: Number(event.target.value) }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
            <input
              placeholder="SKU*"
              value={form.sku}
              onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Image URLs*</p>
            {form.images.map((image, index) => (
              <div key={index} className="flex gap-2">
                <input
                  value={image}
                  onChange={(event) => handleImageChange(index, event.target.value)}
                  placeholder={`Image URL ${index + 1}`}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                />
                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="rounded-xl border border-slate-300 px-3 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addImageField}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
            >
              + Add image URL
            </button>
          </div>

          <textarea
            value={specText}
            onChange={(event) => setSpecText(event.target.value)}
            placeholder="Specifications (one per line) e.g. color:black"
            className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-2.5"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-600 disabled:opacity-70"
          >
            {submitting ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </article>
    </section>
  )
}
