import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

type RegisterPageProps = {
  onSwitchToLogin: () => void
  onBrowseCatalog: () => void
}

export default function RegisterPage({ onSwitchToLogin, onBrowseCatalog }: RegisterPageProps) {
  const { signUp } = useAuth()
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!username || !firstName || !lastName || !email || !password) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน')
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านที่ยืนยันไม่ตรงกัน')
      return
    }

    try {
      setLoading(true)
      setError('')
      await signUp({
        email,
        password,
        username,
        firstName,
        lastName,
        phone,
      })
    } catch {
      setError('สมัครสมาชิกไม่สำเร็จ กรุณาลองอีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
      <h1 className="text-3xl font-semibold text-slate-900">สร้างบัญชีผู้ใช้</h1>
      <p className="mt-2 text-sm text-slate-600">สมัครสมาชิกด้วยอีเมลและรหัสผ่าน</p>

      <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          ชื่อผู้ใช้*
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="กำหนดชื่อผู้ใช้"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          ชื่อ*
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="ชื่อ"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          นามสกุล*
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="นามสกุล"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          อีเมล*
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
          เบอร์โทรศัพท์
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="089xxxxxxx"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          รหัสผ่าน*
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="อย่างน้อย 6 ตัวอักษร"
            autoComplete="new-password"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          ยืนยันรหัสผ่าน*
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="กรอกรหัสผ่านอีกครั้ง"
            autoComplete="new-password"
          />
        </label>

        {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        มีบัญชีอยู่แล้วใช่ไหม?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-brand-600 hover:text-brand-700">
          เข้าสู่ระบบ
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
