import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import { createContext } from 'react'
import PropTypes from 'prop-types'
import { useAuth } from '../auth/AuthProvider'

const FamilyContext = createContext()

export const useFamilies = () => useContext(FamilyContext)

const FamilyProvider = ({ children }) => {
  const [families, setFamilies] = useState()
  const [currentFamilyId, setCurrentFamilyId] = useState()
  const [isLoading, setIsLoading] = useState(true)
  const { token } = useAuth()

  const refreshFamilies = async () =>
    fetch(process.env.REACT_APP_API_URL + '/families/', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (res.status === 200) {
        return res.json().then(data => {
          setFamilies(data)
          setIsLoading(false)
        })
      } else {
        console.log('Error getting families', res.status)
      }
    })

  useEffect(() => {
    refreshFamilies()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (families === undefined || families.length === 0) {
      setCurrentFamilyId(undefined)
      return
    }

    const familyIds = families.map(family => family.id)
    if (currentFamilyId === undefined) {
      setCurrentFamilyId(familyIds[0])
    }
  }, [families, currentFamilyId])

  return (
    <FamilyContext.Provider
      value={{
        families,
        currentFamilyId,
        setCurrentFamilyId,
        refreshFamilies,
        isLoading,
      }}
    >
      {children}
    </FamilyContext.Provider>
  )
}

FamilyProvider.propTypes = {
  children: PropTypes.element.isRequired,
}

export default FamilyProvider
