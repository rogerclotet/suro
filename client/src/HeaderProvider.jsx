import React, { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

const TitleContext = createContext()

export const useHeader = () => useContext(TitleContext)

const HeaderProvider = ({ children }) => {
  const [title, setTitle] = useState()
  const [backLink, setBackLink] = useState()

  const setHeader = (title, backLink = undefined) => {
    setTitle(title)
    setBackLink(backLink)
  }

  return (
    <TitleContext.Provider value={{ title, backLink, setHeader }}>
      {children}
    </TitleContext.Provider>
  )
}

HeaderProvider.propTypes = {
  children: PropTypes.element,
}

export default HeaderProvider
