import React, { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useJwt } from 'react-jwt'
import LoadingScreen from '../LoadingScreen'

const JWT_TOKEN_KEY = 'token'
const JWT_REFRESH_TOKEN_KEY = 'refresh'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState()
  const [isLoading, setIsLoading] = useState(true)

  const { decodedToken, isExpired, reEvaluateToken } = useJwt(token)

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem(JWT_TOKEN_KEY)
    if (tokenFromStorage) {
      reEvaluateToken(tokenFromStorage)
      setToken(tokenFromStorage)
      refreshToken()
    } else {
      setIsLoading(false)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshToken = () => {
    const refreshToken = localStorage.getItem(JWT_REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      return
    }

    fetch(`${process.env.REACT_APP_API_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    }).then(res => {
      if (res.status === 200) {
        return res.json().then(data => {
          if (data) {
            localStorage.setItem(JWT_TOKEN_KEY, data.access)
            setToken(data.access)
          }
        })
      } else {
        console.log('Error refreshing token', res.status)
        logOut()
        setIsLoading(false)
      }
    })
  }

  useEffect(() => {
    if (!token) {
      return
    }

    if (isExpired) {
      refreshToken()
    } else {
      setIsLoggedIn(true)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedToken])

  const logIn = (email, password) => {
    setIsLoading(true)

    fetch(`${process.env.REACT_APP_API_URL}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(res => {
      if (res.status === 200) {
        return res.json().then(data => {
          localStorage.setItem(JWT_TOKEN_KEY, data.access)
          localStorage.setItem(JWT_REFRESH_TOKEN_KEY, data.refresh)
          setToken(data.access)
        })
      } else {
        console.log('Error logging in', res)
      }
    })
  }

  const register = async (email, firstName, lastName, password) => {
    return fetch(`${process.env.REACT_APP_API_URL}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
      }),
    })
  }

  const logOut = () => {
    setToken(undefined)
    setIsLoggedIn(false)
    setUser(undefined)

    localStorage.removeItem(JWT_TOKEN_KEY)
    localStorage.removeItem(JWT_REFRESH_TOKEN_KEY)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoggedIn, isLoading, logIn, register, logOut }}
    >
      {isLoading ? <LoadingScreen /> : children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.element,
}

export default AuthProvider
