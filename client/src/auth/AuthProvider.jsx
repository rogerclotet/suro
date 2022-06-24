import React, { createContext, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { decodeToken, isExpired } from 'react-jwt'
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

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem(JWT_TOKEN_KEY)
    if (!tokenFromStorage) {
      setIsLoading(false)
    }

    if (!isExpired(tokenFromStorage)) {
      setToken(tokenFromStorage)
    } else {
      refreshToken()
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
            setToken(data.access)
            localStorage.setItem(JWT_TOKEN_KEY, data.access)
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

    const decodedToken = decodeToken(token)

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
  }, [token])

  const logIn = (email, password) => {
    setIsLoading(true)

    fetch(`${process.env.REACT_APP_API_URL}/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(res => {
      if (res.status === 200) {
        return res.json().then(data => {
          setToken(data.access)
          localStorage.setItem(JWT_TOKEN_KEY, data.access)
          localStorage.setItem(JWT_REFRESH_TOKEN_KEY, data.refresh)
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
    setIsLoggedIn(false)
    setToken(undefined)
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
