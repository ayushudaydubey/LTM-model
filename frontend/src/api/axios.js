import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api/',
  withCredentials: true, // ensure cookies (httpOnly) are sent
})

export default api
