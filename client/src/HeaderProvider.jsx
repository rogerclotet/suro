import React, { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

const LayoutContext = createContext()

export const useLayout = () => useContext(LayoutContext)

const LayoutProvider = ({ children }) => {
  const [title, setTitle] = useState()
  const [backLink, setBackLink] = useState()
  const [actions, setActions] = useState()
  const [tabs, setTabs] = useState()
  const [fab, setFab] = useState()

  const setHeader = (title, backLink = undefined, actions = null) => {
    setTitle(title)
    setBackLink(backLink)
    setActions(actions)
  }

  return (
    <LayoutContext.Provider
      value={{
        title,
        backLink,
        actions,
        tabs,
        fab,
        setHeader,
        setTabs,
        setFab,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

LayoutProvider.propTypes = {
  children: PropTypes.element,
}

export default LayoutProvider
