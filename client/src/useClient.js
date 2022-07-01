import { useCallback } from 'react'
import { useAuth } from './auth/AuthProvider'
import { useFamilies } from './families/FamilyProvider'

const API_URL = process.env.REACT_APP_API_URL

const useClient = () => {
  const { token } = useAuth()
  const { currentFamilyId } = useFamilies()

  const request = useCallback(
    async (path, options = {}) =>
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

  const invitationsRequest = useCallback(
    async (options = {}) => request(`/invitations/`, options),
    [request]
  )

  const invitationRequest = useCallback(
    async token => request(`/invitations/${token}`),
    [request]
  )

  const familiesRequest = useCallback(
    async (options = {}) => request(`/families/`, options),
    [request]
  )

  const familyRequest = useCallback(
    async (options = {}) => request(`/families/${currentFamilyId}/`, options),
    [request, currentFamilyId]
  )

  const joinFamilyRequest = useCallback(
    async (familyId, options = {}) =>
      request(`/families/${familyId}/join/`, options),
    [request]
  )

  return {
    listsRequest,
    listRequest,
    itemsRequest,
    itemRequest,
    invitationsRequest,
    invitationRequest,
    familiesRequest,
    familyRequest,
    joinFamilyRequest,
  }
}

export default useClient
