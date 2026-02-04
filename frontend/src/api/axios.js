import axios from 'axios'

const api = axios.create({
  baseURL: 'https://ltm-model.onrender.com/api/',
  withCredentials: true, // ensure cookies (httpOnly) are sent
})

export default api
