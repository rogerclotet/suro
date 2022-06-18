import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Lists from './lists/Lists'
import Login from './auth/Login'
import { useAuth } from './auth/AuthProvider'
import LoadingScreen from './LoadingScreen'
import ListDetail from './lists/ListDetail'
import FamilyProvider from './families/FamilyProvider'

const App = () => {
  const { isLoggedIn, isLoading } = useAuth()

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
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    )
  }

  return (
    <FamilyProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="lists" replace />} />
          <Route path="lists" element={<Lists />} />
          <Route path="lists/:listId" element={<ListDetail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </FamilyProvider>
  )
}

export default App
