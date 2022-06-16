import { List, ListItem as MaterialListItem } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import LoadingScreen from '../LoadingScreen'
import { useHeader } from '../HeaderProvider'
import useClient from '../useClient'
import ListItem from './ListItem'
import { useCallback } from 'react'
import ListItemInput from './ListItemInput'

const ListDetail = () => {
  const params = useParams()
  const [list, setList] = useState()
  const { setHeader } = useHeader()
  const { listRequest, itemsRequest } = useClient()

  const refreshList = useCallback(() => {
    if (!params.listId) {
      return
    }

    const listId = params.listId

    listRequest(listId)
      .then(res => res.json())
      .catch(e => console.log('Error loading list detail', e))
      .then(data => setList(data))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    refreshList()
  }, [refreshList])

  useEffect(() => {
    if (list !== undefined) {
      setHeader(list.name, '/lists')
    }
  }, [list, setHeader])

  if (list === undefined) {
    return <LoadingScreen />
  }

  const handleCreateItem = name => {
    itemsRequest(list.id, {
      method: 'POST',
      body: JSON.stringify({ name, order: list.items.length }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (res.status === 201) {
        refreshList()
      } else {
        console.log('Error creating item', res.status)
      }
    })
  }

  return (
    <List>
      <MaterialListItem divider>
        <ListItemInput onChange={handleCreateItem} />
      </MaterialListItem>
      {list.items.map(item => (
        <ListItem
          key={item.id}
          list={list}
          item={item}
          onChange={refreshList}
        />
      ))}
    </List>
  )
}

export default ListDetail
