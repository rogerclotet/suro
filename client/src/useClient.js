import { useCallback } from 'react'
import { useAuth } from './auth/AuthProvider'
import { useFamilies } from './families/FamilyProvider'

const API_URL = process.env.REACT_APP_API_URL

const useClient = () => {
  const { token } = useAuth()
  const { currentFamilyId } = useFamilies()

  const request = useCallback(
    async (path, options) =>
      fetch(API_URL + path, {
        ...options,
        method: options.method || 'GET',
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
      }),
    [token]
  )

  const listsRequest = useCallback(
    async (options = {}) =>
      request(`/families/${currentFamilyId}/lists/`, options),
    [request, currentFamilyId]
  )

  const listRequest = useCallback(
    async (listId, options = {}) =>
      request(`/families/${currentFamilyId}/lists/${listId}/`, options),
    [request, currentFamilyId]
  )

  const itemsRequest = useCallback(
    async (listId, options = {}) =>
      request(`/families/${currentFamilyId}/lists/${listId}/items/`, options),
    [request, currentFamilyId]
  )

  const itemRequest = useCallback(
    async (listId, itemId, options = {}) =>
      request(
        `/families/${currentFamilyId}/lists/${listId}/items/${itemId}/`,
        options
      ),
    [request, currentFamilyId]
  )

  return {
    listsRequest,
    listRequest,
    itemsRequest,
    itemRequest,
  }
}

export default useClient
