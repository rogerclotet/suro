import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import PropTypes from 'prop-types'
import { useJwt } from 'react-jwt'

const JWT_TOKEN_KEY = 'token'
const JWT_REFRESH_TOKEN_KEY = 'refresh'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState()
  const [isLoading, setIsLoading] = useState(true)

  const { decodedToken, isExpired } = useJwt(token)

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem(JWT_TOKEN_KEY)
    if (tokenFromStorage) {
      setToken(tokenFromStorage)
    } else {
      setIsLoading(false)
    }
  }, [])

  const refreshToken = useCallback(() => {
    const refreshToken = localStorage.getItem(JWT_REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      return
    }

    fetch(`${process.env.REACT_APP_API_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })
      .then(res => res.json())
      .catch(e => {
        setIsLoading(false)
        console.log('Error refreshing token', e)
      })
      .then(data => {
        localStorage.setItem(JWT_TOKEN_KEY, data.access)
        setToken(data.access)
      })
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    if (token && isExpired) {
      refreshToken()
    }
  }, [token, isExpired, refreshToken])

  useEffect(() => {
    if (!decodedToken) {
      return
    }

    setUser({
      userId: decodedToken.user_id,
      firstName: decodedToken.first_name,
      lastName: decodedToken.last_name,
    })
    setIsLoggedIn(true)
    setIsLoading(false)

    const timeout = setTimeout(() => {
      refreshToken()
    }, (decodedToken.exp - Date.now() / 1000 - 5) * 1000)

    return () => clearTimeout(timeout)
  }, [decodedToken, refreshToken])

  const logIn = (email, password) => {
    setIsLoading(true)

    fetch(`${process.env.REACT_APP_API_URL}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
      .then(res => res.json())
      .catch(e => console.log('Error logging in', e))
      .then(data => {
        localStorage.setItem(JWT_TOKEN_KEY, data.access)
        localStorage.setItem(JWT_REFRESH_TOKEN_KEY, data.refresh)
        setToken(data.access)
      })
  }

  const logOut = () => {
    // TODO actually log out
    setIsLoggedIn(false)
    setUser(undefined)

    localStorage.removeItem(JWT_TOKEN_KEY)
    localStorage.removeItem(JWT_REFRESH_TOKEN_KEY)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, logIn, logOut, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.element,
}

export default AuthProvider
