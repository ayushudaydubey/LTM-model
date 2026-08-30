import axios from 'axios'

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

const api = axios.create({
  baseURL: isLocalhost ? 'http://localhost:3000/api/' : 'https://ltm-model.onrender.com/api/',
  withCredentials: true, // ensure cookies (httpOnly) are sent
})

export const getSocketUrl = () => {
  return isLocalhost ? 'http://localhost:3000' : 'https://ltm-model.onrender.com'
}

export default api
