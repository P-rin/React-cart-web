import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getUserProfile,
  updateUserAccount,
  type UserAddress,
  type UserProfile,
} from '../../services/user-service'
import { getAccountStatusLabel } from '../../utils/localization'

const emptyAddress: UserAddress = {
  street: '',
  district: '',
  province: '',
  postalCode: '',
  country: '',
}

export default function ProfilePage() {
  const { currentUser, signOutUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState<UserAddress>(emptyAddress)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const data = await getUserProfile(currentUser.uid)

        if (!data) {
          setError('ไม่พบข้อมูลบัญชีผู้ใช้')
          return
        }

        setProfile(data)
        setPhone(data.phone ?? '')
        setAddress(data.address ?? emptyAddress)
      } catch {
        setError('โหลดข้อมูลบัญชีไม่สำเร็จ')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [currentUser])

  const fullName = useMemo(() => {
    if (!profile) {
      return ''
    }
    return `${profile.firstName} ${profile.lastName}`.trim()
  }, [profile])

  const handleAddressChange = (field: keyof UserAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentUser) {
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')
      await updateUserAccount(currentUser.uid, {
        phone,
        address,
      })
      setMessage('อัปเดตข้อมูลบัญชีสำเร็จแล้ว')
    } catch {
      setError('อัปเดตข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-700">กำลังโหลดข้อมูลบัญชี...</p>
  }

  if (!profile) {
    return <p className="text-red-600">{error || 'ไม่มีข้อมูลบัญชี'}</p>
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">บัญชีของฉัน</h1>
          <p className="mt-1 text-sm text-slate-600">จัดการข้อมูลบัญชีของคุณ</p>
        </div>
        <button
          type="button"
          onClick={() => void signOutUser()}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          ออกจากระบบ
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700 sm:grid-cols-2">
        <p>
          <span className="font-semibold text-slate-900">ชื่อ-นามสกุล:</span> {fullName}
        </p>
        <p>
          <span className="font-semibold text-slate-900">ชื่อผู้ใช้:</span> {profile.username}
        </p>
        <p>
          <span className="font-semibold text-slate-900">อีเมล:</span> {profile.email}
        </p>
        <p>
          <span className="font-semibold text-slate-900">สถานะ:</span> {getAccountStatusLabel(profile.status)}
        </p>
      </div>

      <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleUpdate}>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          เบอร์โทรศัพท์
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="089xxxxxxx"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          ที่อยู่
          <input
            value={address.street}
            onChange={(event) => handleAddressChange('street', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="บ้านเลขที่ ถนน"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          เขต/อำเภอ
          <input
            value={address.district}
            onChange={(event) => handleAddressChange('district', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="เขต/อำเภอ"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          จังหวัด
          <input
            value={address.province}
            onChange={(event) => handleAddressChange('province', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="จังหวัด"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          รหัสไปรษณีย์
          <input
            value={address.postalCode}
            onChange={(event) => handleAddressChange('postalCode', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="10110"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          ประเทศ
          <input
            value={address.country}
            onChange={(event) => handleAddressChange('country', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="ประเทศไทย"
          />
        </label>

        {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700 sm:col-span-2">{message}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลบัญชี'}
        </button>
      </form>
    </section>
  )
}
