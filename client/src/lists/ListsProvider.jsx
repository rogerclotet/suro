import React, { createContext, useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useContext } from 'react'
import useClient from 'useClient'
import { useFamilies } from 'families/FamilyProvider'

const ListsContext = createContext()

export const useLists = () => useContext(ListsContext)

const ListsProvider = ({ children }) => {
  const [lists, setLists] = useState()
  const { listsRequest } = useClient()
  const { currentFamilyId } = useFamilies()

  const refreshLists = useCallback(() => {
    if (!currentFamilyId) {
      return
    }

    setLists(undefined)

    listsRequest().then(res => {
      if (res.status !== 200) {
        console.log('Error getting lists', res)
        return
      }

      res.json().then(data => {
        setLists(data)
      })
    })
  }, [listsRequest, currentFamilyId])

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
