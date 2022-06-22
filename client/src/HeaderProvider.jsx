import React, { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

const TitleContext = createContext()

export const useHeader = () => useContext(TitleContext)

const HeaderProvider = ({ children }) => {
  const [title, setTitle] = useState()
  const [backLink, setBackLink] = useState()
  const [actions, setActions] = useState()

  const setHeader = (title, backLink = undefined, actions = null) => {
    setTitle(title)
    setBackLink(backLink)
    setActions(actions)
  }

  return (
    <TitleContext.Provider value={{ title, backLink, actions, setHeader }}>
      {children}
    </TitleContext.Provider>
  )
}

HeaderProvider.propTypes = {
  children: PropTypes.element,
}

export default HeaderProvider
