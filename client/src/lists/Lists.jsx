import React, { useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import { Link, Outlet, useLocation } from 'react-router-dom'
import ListsProvider from './ListsProvider'

const Lists = () => {
  const location = useLocation()
  const [tab, setTab] = useState(() => {
    const pathParts = location.pathname.split('/')
    return pathParts[pathParts.length - 1] === 'templates' ? 1 : 0
  })

  const handleTabChange = (event, value) => {
    setTab(value)
  }

  return (
    <ListsProvider>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ backgroundColor: 'divider' }}
      >
        <Tab label="Llistes" LinkComponent={Link} to="lists" />
        <Tab label="Plantilles" LinkComponent={Link} to="templates" />
      </Tabs>

      <Outlet />
    </ListsProvider>
  )
}

export default Lists
