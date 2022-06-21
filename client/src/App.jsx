import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import Layout from './Layout'
import Lists from './lists/Lists'
import Login from './auth/Login'
import { useAuth } from './auth/AuthProvider'
import LoadingScreen from './LoadingScreen'
import ListDetail from './lists/ListDetail'
import FamilyProvider from './families/FamilyProvider'
import ListsList from './lists/ListsList'
import { LIST_TYPE_LISTS, LIST_TYPE_TEMPLATES } from './lists/constants'
import FamilySettings from './families/FamilySettings'

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
          <Route path="lists" element={<Lists />}>
            <Route index element={<Navigate to="lists" replace />} />
            <Route
              path="lists"
              element={<ListsList type={LIST_TYPE_LISTS} />}
            />
            <Route
              path="templates"
              element={<ListsList type={LIST_TYPE_TEMPLATES} />}
            />
          </Route>
          <Route path="list/:listId" element={<ListDetail />} />
          <Route
            path="family/:familyId"
            element={<FamilySettings invitationToken={invitationToken} />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </FamilyProvider>
  )
}

export default App
