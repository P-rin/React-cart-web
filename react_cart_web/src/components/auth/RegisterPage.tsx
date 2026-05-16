import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

type RegisterPageProps = {
  onSwitchToLogin: () => void
}

export default function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
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
      setError('Please fill all required fields.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.')
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
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-card">
      <h1 className="text-3xl font-semibold text-slate-900">Create Account</h1>
      <p className="mt-2 text-sm text-slate-600">Sign up with email and password.</p>

      <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Username*
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="john_doe"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          First name*
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="John"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Last name*
          <input
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="Doe"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Email*
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Phone
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="089xxxxxxx"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password*
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Confirm password*
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none ring-brand-500 transition focus:ring-2"
            placeholder="Repeat password"
            autoComplete="new-password"
          />
        </label>

        {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 w-full rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-brand-600 hover:text-brand-700">
          Login
        </button>
      </p>
    </section>
  )
}
