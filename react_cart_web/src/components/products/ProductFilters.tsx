type ProductFiltersProps = {
  searchTerm: string
  selectedCategory: string
  categories: string[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
}

export default function ProductFilters({
  searchTerm,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
}: ProductFiltersProps) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <input
        type="text"
        placeholder="ค้นหาสินค้าด้วยชื่อ..."
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2 md:max-w-md"
      />

      <select
        value={selectedCategory}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
      >
        {categories.map((category) => (
          <option key={category} value={category}>
            {category === 'all' ? 'ทุกหมวดหมู่' : getCategoryLabel(category)}
          </option>
        ))}
      </select>
    </section>
  )
}
import { getCategoryLabel } from '../../utils/localization'
