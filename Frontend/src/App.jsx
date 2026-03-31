import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from '@/components/login'
import Register from '@/components/register'
import Frontpage from '@/components/frontpage'
import Profile from './components/profile'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Frontpage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
