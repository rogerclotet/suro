import React, { useEffect, useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import { Link, Outlet, useLocation } from 'react-router-dom'
import ListsProvider from './ListsProvider'

const Lists = () => {
  const location = useLocation()
  const [tab, setTab] = useState(0)

  useEffect(() => {
    const pathParts = location.pathname.split('/')
    setTab(pathParts[pathParts.length - 1] === 'templates' ? 1 : 0)
  }, [location.pathname])

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
