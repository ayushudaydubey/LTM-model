import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import styles from './Register.module.css'

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: ""
  });

  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await api.post("auth/register", {
        email: form.email,
        fullName: {
          firstName: form.firstName,
          lastName: form.lastName
        },
        password: form.password
      });

      setMsg(res.data.message)
      if (res.status === 201 || res.status === 200) {
        navigate('/login')
      }
    } catch (err) {
      if (!err.response) setMsg('Server unreachable. Is backend running?')
      else setMsg(err.response?.data?.message || 'Error')
    }
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerCard}>
        <h2>Register</h2>

        {msg && <p className={styles.message}>{msg}</p>}

        <form onSubmit={handleSubmit} className={styles.registerForm}>

          <input name="email" placeholder="Email" onChange={handleChange} />

          <input name="firstName" placeholder="First Name" onChange={handleChange} />

          <input name="lastName" placeholder="Last Name" onChange={handleChange} />

          <input name="password" type="password" placeholder="Password" onChange={handleChange} />

          <button type="submit">Create Account</button>
        </form>
      </div>
    </div>
  );
}
