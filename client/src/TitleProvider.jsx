import React, { createContext, useContext, useState } from 'react'
import PropTypes from 'prop-types'

const TitleContext = createContext()

export const useTitle = () => useContext(TitleContext)

const TitleProvider = ({ children }) => {
  const [title, setTitle] = useState('Família')

  return (
    <TitleContext.Provider value={{ title, setTitle }}>
      {children}
    </TitleContext.Provider>
  )
}

TitleProvider.propTypes = {
  children: PropTypes.element,
}

export default TitleProvider
