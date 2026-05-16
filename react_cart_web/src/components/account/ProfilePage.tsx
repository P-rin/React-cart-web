import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getUserProfile,
  updateUserAccount,
  type UserAddress,
  type UserProfile,
} from '../../services/user-service'

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
          setError('User profile was not found in Firestore.')
          return
        }

        setProfile(data)
        setPhone(data.phone ?? '')
        setAddress(data.address ?? emptyAddress)
      } catch {
        setError('Failed to load profile.')
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
      setMessage('Profile updated successfully.')
    } catch {
      setError('Update failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-700">Loading profile...</p>
  }

  if (!profile) {
    return <p className="text-red-600">{error || 'No profile data.'}</p>
  }

  return (
    <section className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">My Account</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your account information.</p>
        </div>
        <button
          type="button"
          onClick={() => void signOutUser()}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Sign Out
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700 sm:grid-cols-2">
        <p>
          <span className="font-semibold text-slate-900">Name:</span> {fullName}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Username:</span> {profile.username}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Email:</span> {profile.email}
        </p>
        <p>
          <span className="font-semibold text-slate-900">Status:</span> {profile.status}
        </p>
      </div>

      <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleUpdate}>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Phone
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="089xxxxxxx"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Street
          <input
            value={address.street}
            onChange={(event) => handleAddressChange('street', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="123 Main St"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          District
          <input
            value={address.district}
            onChange={(event) => handleAddressChange('district', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="Watthana"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Province
          <input
            value={address.province}
            onChange={(event) => handleAddressChange('province', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="Bangkok"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Postal code
          <input
            value={address.postalCode}
            onChange={(event) => handleAddressChange('postalCode', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="10110"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Country
          <input
            value={address.country}
            onChange={(event) => handleAddressChange('country', event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="Thailand"
          />
        </label>

        {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700 sm:col-span-2">{message}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Update Account'}
        </button>
      </form>
    </section>
  )
}
