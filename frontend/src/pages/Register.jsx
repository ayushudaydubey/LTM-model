import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Bot, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft
} from 'lucide-react'
import styles from './Register.module.css'
import api from '../api/axios'
import NeuralBackground from '../components/NeuralBackground'

export default function Register() {
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg('')
    setIsError(false)
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

      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }

      setIsError(false)
      setMsg(res.data.message || 'Account created successfully! Redirecting...')

      if (res.status === 200 || res.status === 201) {
        setTimeout(() => navigate('/login'), 1000)
      }

    } catch (err) {
      setIsError(true)
      if (!err.response) {
        setMsg('Server unreachable. Is backend running on port 3000?')
      } else {
        const status = err.response.status
        const errorMsg = err.response?.data?.message || 'Something went wrong.'

        // If account already exists -> redirect to login
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
    <div className={styles.authContainer}>
      <NeuralBackground />

      {/* Top Bar Navigation */}
      <header className={styles.navHeader}>
        <Link to="/" className={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to Lilly AI</span>
        </Link>

        <div className={styles.statusPill}>
          <span className={styles.statusText}>Lilly AI Online</span>
        </div>
      </header>

      {/* Auth Card */}
      <div className={styles.cardWrapper}>
        <div className={styles.cardGlowRing} />
        
        <div className={styles.authCard}>
          {/* Header Brand */}
          <div className={styles.cardHeader}>
            <div className={styles.logoBadge}>
              <div className={styles.logoIconGlow}>
                <Bot className={styles.brandIcon} size={28} />
              </div>
            </div>

            <h1 className={styles.title}>
              Create <span className={styles.gradientText}>Account</span>
            </h1>
            <p className={styles.subtitle}>
              Sign up to get started with Lilly AI.
            </p>
          </div>

          {/* Alert Message Banner */}
          {msg && (
            <div className={`${styles.alertBanner} ${isError ? styles.alertError : styles.alertSuccess}`}>
              {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{msg}</span>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Full Name Row */}
            <div className={styles.nameRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="firstName" className={styles.inputLabel}>
                  First Name
                </label>
                <div className={styles.inputWrapper}>
                  <User className={styles.fieldIcon} size={18} />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="lastName" className={styles.inputLabel}>
                  Last Name
                </label>
                <div className={styles.inputWrapper}>
                  <User className={styles.fieldIcon} size={18} />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.inputLabel}>
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.fieldIcon} size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.inputLabel}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.fieldIcon} size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.passwordToggle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className={`${styles.submitBtn} ${loading ? styles.btnLoading : ''}`}
            >
              <span className={styles.btnShimmer} />
              {loading ? (
                <div className={styles.loadingSpinnerWrap}>
                  <div className={styles.spinner} />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className={styles.btnContent}>
                  <span>Register</span>
                  <ArrowRight size={18} className={styles.btnArrow} />
                </div>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className={styles.cardFooter}>
            <p className={styles.switchText}>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/login')} 
                className={styles.switchLink}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
