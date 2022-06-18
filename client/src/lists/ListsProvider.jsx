import React, { createContext, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useContext } from 'react'
import useClient from '../useClient'

const ListsContext = createContext()

export const useLists = () => useContext(ListsContext)

const ListsProvider = ({ children }) => {
  const [lists, setLists] = useState()
  const { listsRequest } = useClient()

  const refreshLists = useCallback(() => {
    listsRequest()
      .then(res => res.json().then(setLists))
      .catch(e => console.log('Error loading lists', e))
  }, [listsRequest])

  useEffect(() => {
    refreshLists()
  }, [refreshLists])

  const createList = async data => {
    return listsRequest({
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  return (
    <ListsContext.Provider value={{ lists, refreshLists, createList }}>
      {children}
    </ListsContext.Provider>
  )
}

ListsProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default ListsProvider
