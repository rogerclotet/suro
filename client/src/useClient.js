import { useAuth } from './auth/AuthProvider'

const API_URL = process.env.REACT_APP_API_URL

const useClient = () => {
  const { token } = useAuth()

  const request = async (path, options) => {
    return fetch(API_URL + path, {
      ...options,
      method: options.method || 'GET',
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    })
  }

  const familiesRequest = async (options = {}) => {
    return request('/families/', options)
  }

  // TODO use current family id
  const listsRequest = async (options = {}) => {
    return request(`/families/1/lists/`, options)
  }

  // TODO use current family id
  const listRequest = async (listId, options = {}) => {
    return request(`/families/1/lists/${listId}/`, options)
  }

  // TODO use current family id
  const itemRequest = async (listId, itemId, options = {}) => {
    return request(`/families/1/lists/${listId}/items/${itemId}/`, options)
  }

  return { familiesRequest, listsRequest, listRequest, itemRequest }
}

export default useClient
