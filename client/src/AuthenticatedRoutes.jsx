import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Lists from './lists/Lists'
import ListDetail from './lists/ListDetail'
import ListsList from './lists/ListsList'
import { LIST_TYPE_LISTS, LIST_TYPE_TEMPLATES } from './lists/constants'
import FamilySettings from './families/FamilySettings'
import PropTypes from 'prop-types'
import { useFamilies } from './families/FamilyProvider'
import NoCurrentFamily from './families/NoCurrentFamily'
import LoadingScreen from './LoadingScreen'
import FamilyRoute from './families/FamilyRoute'

const AuthenticatedRoutes = ({ invitationToken }) => {
  const { families, currentFamilyId, isLoading } = useFamilies()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (families === []) {
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<NoCurrentFamily />} />
          <Route
            path="f/:familyId"
            element={<FamilySettings invitationToken={invitationToken} />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={<Navigate to={`f/${currentFamilyId}/l/lists`} replace />}
        />
        <Route path="f/:familyId" element={<FamilyRoute />}>
          <Route
            index
            element={<FamilySettings invitationToken={invitationToken} />}
          />
          <Route path="l" element={<Lists />}>
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
          <Route path="l/:listId" element={<ListDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}

AuthenticatedRoutes.propTypes = {
  invitationToken: PropTypes.string,
}

export default AuthenticatedRoutes
