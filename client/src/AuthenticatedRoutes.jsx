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

const AuthenticatedRoutes = ({ invitationToken }) => {
  const { currentFamilyId } = useFamilies()

  if (!currentFamilyId) {
    return (
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<NoCurrentFamily />} />
          <Route
            path="family/:familyId"
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
        <Route index element={<Navigate to="lists" replace />} />
        <Route path="lists" element={<Lists />}>
          <Route index element={<Navigate to="lists" replace />} />
          <Route path="lists" element={<ListsList type={LIST_TYPE_LISTS} />} />
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
  )
}

AuthenticatedRoutes.propTypes = {
  invitationToken: PropTypes.string,
}

export default AuthenticatedRoutes
