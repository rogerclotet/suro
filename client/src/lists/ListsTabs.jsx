import React, { useEffect, useState } from 'react'
import { Tab, Tabs } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { useFamilies } from '../families/FamilyProvider'

const getCurrentTab = () => {
  const pathParts = location.pathname.split('/')
  return pathParts[pathParts.length - 1] === 'templates' ? 1 : 0
}

const ListsTabs = () => {
  const [tab, setTab] = useState(getCurrentTab)
  const location = useLocation()
  const { currentFamilyId } = useFamilies()

  useEffect(() => {
    setTab(getCurrentTab())

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleTabChange = (event, value) => {
    setTab(value)
  }

  return (
    <Tabs
      value={tab}
      onChange={handleTabChange}
      variant="fullWidth"
      sx={{ backgroundColor: 'divider' }}
    >
      <Tab
        label="Llistes"
        LinkComponent={Link}
        to={`f/${currentFamilyId}/l/lists`}
      />
      <Tab
        label="Plantilles"
        LinkComponent={Link}
        to={`f/${currentFamilyId}/l/templates`}
      />
    </Tabs>
  )
}

export default ListsTabs
