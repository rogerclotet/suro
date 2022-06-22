import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import Layout from './Layout'
import Login from './auth/Login'
import { useAuth } from './auth/AuthProvider'
import LoadingScreen from './LoadingScreen'
import FamilyProvider from './families/FamilyProvider'
import Register from './auth/Register'
import AuthenticatedRoutes from './AuthenticatedRoutes'

const App = () => {
  const { isLoggedIn, isLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const [invitationToken, setInvitationToken] = useState()

  useEffect(() => {
    const token = searchParams.get('t')
    if (token) {
      setInvitationToken(token)
    }
  }, [searchParams])

  if (isLoading) {
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index path="*" element={<LoadingScreen />} />
        </Route>
      </Routes>
    )
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    )
  }

  return (
    <FamilyProvider>
      <AuthenticatedRoutes invitationToken={invitationToken} />
    </FamilyProvider>
  )
}

export default App
