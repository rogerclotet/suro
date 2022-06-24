import React, { useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useFamilies } from './FamilyProvider'

const FamilyRoute = () => {
  const params = useParams()
  const { families, currentFamilyId, setCurrentFamilyId, isLoading } =
    useFamilies()

  useEffect(() => {
    if (isLoading || !families || families.length === 0) {
      return
    }

    const familyId = Number(params.familyId)
    if (familyId === currentFamilyId) {
      return
    }

    const familyIds = families.map(family => family.id)
    if (familyIds.includes(familyId)) {
      setCurrentFamilyId(Number(familyId))
      return
    }

    setCurrentFamilyId(familyIds[0])
  }, [
    isLoading,
    families,
    params.familyId,
    currentFamilyId,
    setCurrentFamilyId,
  ])

  return <Outlet />
}

export default FamilyRoute
