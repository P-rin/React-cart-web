import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

type LoginPageProps = {
  onSwitchToRegister: () => void
  onBrowseCatalog: () => void
}

export default function LoginPage({ onSwitchToRegister, onBrowseCatalog }: LoginPageProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }

    try {
      setLoading(true)
      setError('')
      await signIn(email, password)
    } catch {
      setError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
      <h1 className="text-3xl font-semibold text-slate-900">ยินดีต้อนรับกลับมา</h1>
      <p className="mt-2 text-sm text-slate-600">เข้าสู่ระบบด้วยอีเมลของคุณ</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          อีเมล
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="กรอกอีเมลของคุณ"
            autoComplete="email"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          รหัสผ่าน
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        ยังไม่มีบัญชีใช่ไหม?{' '}
        <button type="button" onClick={onSwitchToRegister} className="font-semibold text-brand-600 hover:text-brand-700">
          สมัครสมาชิก
        </button>
      </p>
      <button
        type="button"
        onClick={onBrowseCatalog}
        className="mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700"
      >
        กลับไปเลือกชมสินค้า
      </button>
    </section>
  )
}
