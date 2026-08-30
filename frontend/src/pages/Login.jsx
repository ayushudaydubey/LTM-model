import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Bot,
  ArrowLeft 
} from 'lucide-react'
import styles from './Login.module.css'
import api from '../api/axios'
import NeuralBackground from '../components/NeuralBackground'

export default function Login() {
  const [form, setForm] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
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
      // server sets httpOnly cookie
      const res = await api.post('auth/login', form)
      if (res.data?.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
      setIsError(false)
      setMsg(res.data?.message || 'Login successful! Redirecting...')
      setTimeout(() => {
        navigate('/chat')
      }, 700)
    } catch (err) {
      setIsError(true)
      if (!err.response) {
        setMsg('Server unreachable. Is backend running on port 3000?')
      } else {
        setMsg(err.response?.data?.message || 'Invalid credentials. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <NeuralBackground />

      {/* Top Navigation */}
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
          {/* Header */}
          <div className={styles.cardHeader}>
            <div className={styles.logoBadge}>
              <div className={styles.logoIconGlow}>
                <Bot className={styles.brandIcon} size={28} />
              </div>
            </div>

            <h1 className={styles.title}>
              Sign <span className={styles.gradientText}>In</span>
            </h1>
            <p className={styles.subtitle}>
              Enter your credentials to access Lilly AI.
            </p>
          </div>

          {/* Alert Message */}
          {msg && (
            <div className={`${styles.alertBanner} ${isError ? styles.alertError : styles.alertSuccess}`}>
              {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{msg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
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
              <div className={styles.labelRow}>
                <label htmlFor="password" className={styles.inputLabel}>
                  Password
                </label>
              </div>
              <div className={styles.inputWrapper}>
                <Lock className={styles.fieldIcon} size={18} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
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

            {/* Remember Me */}
            <div className={styles.optionsRow}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Remember me</span>
              </label>
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
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className={styles.btnContent}>
                  <span>Sign In</span>
                  <ArrowRight size={18} className={styles.btnArrow} />
                </div>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className={styles.cardFooter}>
            <p className={styles.switchText}>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/register')} 
                className={styles.switchLink}
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
