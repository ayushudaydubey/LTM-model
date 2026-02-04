import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import styles from './Register.module.css'

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  })

  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)

    try {
      const res = await api.post('auth/register', {
        email: form.email,
        fullName: {
          firstName: form.firstName,
          lastName: form.lastName
        },
        password: form.password
      })

      setMsg(res.data.message || 'Registered successfully')

      if (res.status === 200 || res.status === 201) {
        setTimeout(() => navigate('/login'), 1200)
      }

    } catch (err) {
      if (!err.response) {
        setMsg('Server unreachable. Is backend running?')
      } else {
        const status = err.response.status
        const errorMsg = err.response?.data?.message || 'Something went wrong'

        // ✅ If account already exists → redirect to login
        if (status === 409 || errorMsg.toLowerCase().includes('already')) {
          setMsg('Account already exists. Redirecting to login...')
          setTimeout(() => navigate('/login'), 1500)
        } else {
          setMsg(errorMsg)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerCard}>
        <h2>Create Account</h2>

        {msg && <p className={styles.message}>{msg}</p>}

        <form onSubmit={handleSubmit} className={styles.registerForm}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            onChange={handleChange}
          />

          <input
            name="firstName"
            placeholder="First Name"
            required
            onChange={handleChange}
          />

          <input
            name="lastName"
            placeholder="Last Name"
            required
            onChange={handleChange}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Optional manual login link */}
        <p className={styles.loginHint}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} > <span className={styles.login}>Login</span></span>
        </p>
      </div>
    </div>
  )
}
