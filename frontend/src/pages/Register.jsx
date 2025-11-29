import { useState } from 'react'

import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

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
      // optional: navigate to login after successful registration
      if (res.status === 201 || res.status === 200) {
        navigate('/login')
      }
    } catch (err) {
      if (!err.response) setMsg('Server unreachable. Is backend running on port 3000?')
      else setMsg(err.response?.data?.message || 'Error')
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <p>{msg}</p>

      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" onChange={handleChange} />

        <input name="firstName" placeholder="First Name" onChange={handleChange} />

        <input name="lastName" placeholder="Last Name" onChange={handleChange} />

        <input name="password" type="password" placeholder="Password" onChange={handleChange} />

        <button type="submit">Register</button>
      </form>
    </div>
  );
}
