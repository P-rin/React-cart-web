import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  productsService,
  type Product,
  type ProductInput,
  type StockAdjustmentInput,
} from '../services/firestore-service'

type ProductContextValue = {
  products: Product[]
  selectedProduct: Product | null
  loading: boolean
  error: string
  searchTerm: string
  selectedCategory: string
  categories: string[]
  setSearchTerm: (value: string) => void
  setSelectedCategory: (value: string) => void
  fetchProducts: (options?: { includeInactive?: boolean }) => Promise<void>
  fetchProductById: (productId: string) => Promise<void>
  clearSelectedProduct: () => void
  createProduct: (input: ProductInput) => Promise<string>
  updateProduct: (productId: string, input: ProductInput) => Promise<void>
  softDeleteProduct: (productId: string) => Promise<void>
  restoreProduct: (productId: string) => Promise<void>
  adjustProductStock: (input: StockAdjustmentInput) => Promise<number>
}

const ProductContext = createContext<ProductContextValue | undefined>(undefined)

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = useMemo(() => {
    const categorySet = new Set(products.map((item) => item.category))
    return ['all', ...Array.from(categorySet)]
  }, [products])

  const fetchProducts = useCallback(
    async (options?: { includeInactive?: boolean }) => {
      try {
        setLoading(true)
        setError('')
        const data = await productsService.getProducts({
          search: searchTerm,
          category: selectedCategory,
          includeInactive: options?.includeInactive,
        })
        setProducts(data)
      } catch (err) {
        console.error('fetchProducts failed:', err)
        setError('โหลดสินค้าไม่สำเร็จ')
      } finally {
        setLoading(false)
      }
    },
    [searchTerm, selectedCategory],
  )

  const fetchProductById = useCallback(async (productId: string) => {
    try {
      setLoading(true)
      setError('')
      const data = await productsService.getProductById(productId)
      if (data?.status !== 'active') {
        setSelectedProduct(null)
        setError('ไม่พบข้อมูลสินค้าหรือสินค้านี้ไม่มีจำหน่ายแล้ว')
        return
      }
      setSelectedProduct(data)
    } catch {
      setError('โหลดรายละเอียดสินค้าไม่สำเร็จ')
      setSelectedProduct(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearSelectedProduct = useCallback(() => {
    setSelectedProduct(null)
  }, [])

  const createProduct = useCallback(async (input: ProductInput) => {
    try {
      setLoading(true)
      setError('')
      const productId = await productsService.createProduct(input)
      await fetchProducts({ includeInactive: true })
      return productId
    } catch {
      setError('เพิ่มสินค้าไม่สำเร็จ')
      throw new Error('เพิ่มสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  const updateProduct = useCallback(async (productId: string, input: ProductInput) => {
    try {
      setLoading(true)
      setError('')
      await productsService.updateProduct(productId, input)
      await fetchProducts({ includeInactive: true })
    } catch {
      setError('อัปเดตสินค้าไม่สำเร็จ')
      throw new Error('อัปเดตสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  const softDeleteProduct = useCallback(async (productId: string) => {
    try {
      setLoading(true)
      setError('')
      await productsService.softDeleteProduct(productId)
      await fetchProducts({ includeInactive: true })
    } catch {
      setError('ซ่อนสินค้าไม่สำเร็จ')
      throw new Error('ซ่อนสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  const restoreProduct = useCallback(async (productId: string) => {
    try {
      setLoading(true)
      setError('')
      await productsService.restoreProduct(productId)
      await fetchProducts({ includeInactive: true })
    } catch {
      setError('กู้คืนสินค้าไม่สำเร็จ')
      throw new Error('กู้คืนสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  const adjustProductStock = useCallback(async (input: StockAdjustmentInput) => {
    try {
      setLoading(true)
      setError('')
      const nextStock = await productsService.adjustProductStock(input)
      await fetchProducts({ includeInactive: true })
      return nextStock
    } catch {
      setError('ปรับจำนวนสินค้าไม่สำเร็จ')
      throw new Error('ปรับจำนวนสินค้าไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [fetchProducts])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  const value = useMemo(
    () => ({
      products,
      selectedProduct,
      loading,
      error,
      searchTerm,
      selectedCategory,
      categories,
      setSearchTerm,
      setSelectedCategory,
      fetchProducts,
      fetchProductById,
      clearSelectedProduct,
      createProduct,
      updateProduct,
      softDeleteProduct,
      restoreProduct,
      adjustProductStock,
    }),
    [
      products,
      selectedProduct,
      loading,
      error,
      searchTerm,
      selectedCategory,
      categories,
      fetchProducts,
      fetchProductById,
      clearSelectedProduct,
      createProduct,
      updateProduct,
      softDeleteProduct,
      restoreProduct,
      adjustProductStock,
    ],
  )

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used within ProductProvider')
  }
  return context
}
