import { useState, useEffect } from 'react'

const KEY = 'gp_user'
let _listeners = []

function notify(user) {
  _listeners.forEach(fn => fn(user))
}

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(KEY)
      return s ? JSON.parse(s) : null
    } catch(e) { return null }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fn = (u) => setUser(u)
    _listeners.push(fn)
    return () => { _listeners = _listeners.filter(l => l !== fn) }
  }, [])

  const login = (userData) => {
    localStorage.setItem(KEY, JSON.stringify(userData))
    notify(userData)
  }

  const logout = () => {
    localStorage.removeItem(KEY)
    notify(null)
  }

  return { user, loading, login, logout }
}