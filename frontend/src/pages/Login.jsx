import { useState } from 'react'
import styles from './Login.module.css'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Login() {
  const [form, setForm] = useState({
    email: '',
    password: ''
  })

  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg('')

    try {
      // server sets httpOnly cookie
      const res = await api.post('auth/login', form)

      setMsg(res.data?.message || 'Login successful!')
      navigate('/chat')
    } catch (err) {
      if (!err.response)
        setMsg('Server unreachable. Is backend running on port 3000?')
      else
        setMsg(err.response?.data?.message || 'Error')
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h2>Login</h2>

        {msg && <p className={styles.message}>{msg}</p>}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <button type="submit">Login</button>
        </form>

      
        <p className={styles.loginHint}>
          Don’t have an account?{' '}
          <span className= {styles.register} onClick={() => navigate('/register')}>
            Create account
          </span>
        </p>
      </div>
    </div>
  )
}
