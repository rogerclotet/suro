import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import ListsProvider from './ListsProvider'
import { useLayout } from 'HeaderProvider'
import ListsTabs from './ListsTabs'

const Lists = () => {
  const { setTabs } = useLayout()

  useEffect(() => {
    setTabs(<ListsTabs />)

    return () => setTabs(undefined)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ListsProvider>
      <Outlet />
    </ListsProvider>
  )
}

export default Lists
