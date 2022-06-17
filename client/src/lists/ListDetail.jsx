import {
  IconButton,
  List,
  ListItem as MaterialListItem,
  ListSubheader,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import LoadingScreen from '../LoadingScreen'
import { useHeader } from '../HeaderProvider'
import useClient from '../useClient'
import ListItem from './ListItem'
import { useCallback } from 'react'
import ListItemInput from './ListItemInput'
import { Helmet } from 'react-helmet-async'
import { Done, Edit } from '@mui/icons-material'

const ListDetail = () => {
  const params = useParams()
  const [list, setList] = useState()
  const [itemsByCategory, setItemsByCategory] = useState()
  const [isEditing, setIsEditing] = useState(false)
  const { setHeader } = useHeader()
  const { listRequest, itemsRequest } = useClient()

  const toggleIsEditing = () => {
    setIsEditing(!isEditing)
  }

  const refreshList = useCallback(() => {
    if (!params.listId) {
      return
    }

    const listId = params.listId

    listRequest(listId)
      .then(res => res.json())
      .catch(e => console.log('Error loading list detail', e))
      .then(data => {
        const newItemsByCategory = {}
        data.items.forEach(item => {
          if (!(item.category in newItemsByCategory)) {
            newItemsByCategory[item.category] = [item]
          } else {
            newItemsByCategory[item.category].push(item)
          }
        })
        setItemsByCategory(newItemsByCategory)
        setList(data)
      })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.listId])

  useEffect(() => {
    refreshList()
  }, [refreshList])

  useEffect(() => {
    if (list !== undefined) {
      setHeader(
        list.name,
        '/lists',
        <IconButton size="large" edge="end" onClick={toggleIsEditing}>
          {isEditing ? <Done /> : <Edit />}
        </IconButton>
      )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, isEditing])

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
    <>
      <Helmet>
        <title>{list.name}</title>
        <meta
          name="description"
          content={`Llista amb ${list.items.length} elements. ${list.description}`}
        />
      </Helmet>
      <List sx={{ pt: 0 }}>
        {Object.keys(itemsByCategory).map(category => (
          <div key={category}>
            <ListSubheader
              inset
              sx={{
                backgroundColor: '#2f2f2f', // Divider color without opacity
              }}
            >
              {category === '' ? 'Sense categoria' : category}
            </ListSubheader>

            {isEditing && (
              <MaterialListItem divider>
                <ListItemInput onChange={handleCreateItem} />
              </MaterialListItem>
            )}

            {itemsByCategory[category].map(item => (
              <ListItem
                key={item.id}
                list={list}
                item={item}
                isEditing={isEditing}
                onChange={refreshList}
              />
            ))}
          </div>
        ))}
      </List>
    </>
  )
}

export default ListDetail
