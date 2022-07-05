import { useSnackbar } from 'notistack'
import { useCallback } from 'react'
import { useAuth } from './auth/AuthProvider'

const API_URL = process.env.REACT_APP_API_URL

const useClient = () => {
  const { token } = useAuth()
  const { enqueueSnackbar } = useSnackbar()

  const request = useCallback(
    async (path, options = {}) =>
      fetch(API_URL + path, {
        ...options,
        method: options.method || 'GET',
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
      }).catch(err => {
        enqueueSnackbar('Hi ha hagut un problema de xarxa', {
          variant: 'error',
        })
        console.log('Network error', err)
      }),
    [token, enqueueSnackbar]
  )

  const listsRequest = useCallback(
    async (familyId, options = {}) =>
      request(`/families/${familyId}/lists/`, options),
    [request]
  )

  const listRequest = useCallback(
    async (familyId, listId, options = {}) =>
      request(`/families/${familyId}/lists/${listId}/`, options),
    [request]
  )

  const itemsRequest = useCallback(
    async (familyId, listId, options = {}) =>
      request(`/families/${familyId}/lists/${listId}/items/`, options),
    [request]
  )

  const itemRequest = useCallback(
    async (familyId, listId, itemId, options = {}) =>
      request(
        `/families/${familyId}/lists/${listId}/items/${itemId}/`,
        options
      ),
    [request]
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
    async (familyId, options = {}) =>
      request(`/families/${familyId}/`, options),
    [request]
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
