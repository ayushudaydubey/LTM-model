import { useState } from 'react'

import { useNavigate } from 'react-router-dom'
import axiosInstance from '../axios';


export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
        // server should set an httpOnly cookie; axios instance already uses withCredentials
        const res = await axiosInstance.post('auth/login', form)

        setMsg(res.data?.message || 'Login successful!')
        navigate('/chat')
    } catch (err) {
      // network error (server down) vs server error
      if (!err.response) setMsg('Server unreachable. Is backend running on port 3000?')
      else setMsg(err.response?.data?.message || 'Error')
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <p>{msg}</p>

      <form onSubmit={handleSubmit}>
        <input name="email" placeholder="Email" onChange={handleChange} />

        <input name="password" type="password" placeholder="Password" onChange={handleChange} />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
