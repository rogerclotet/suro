import {
  IconButton,
  List,
  ListItem as MaterialListItem,
  Typography,
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
import ItemCategory from './ItemCategory'

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
        `/lists/${list.is_template ? 'templates' : 'lists'}`,
        list.is_template ? null : (
          <IconButton size="large" edge="end" onClick={toggleIsEditing}>
            {isEditing ? <Done /> : <Edit />}
          </IconButton>
        )
      )
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, isEditing])

  if (list === undefined) {
    return <LoadingScreen />
  }

  const handleCreateItem = (name, category) => {
    itemsRequest(list.id, {
      method: 'POST',
      body: JSON.stringify({ name, category, order: list.items.length }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (res.status === 201) {
        refreshList()
      } else {
        console.log('Error creating item', res.status)
      }
    })
  }

  const handleCreateCategory = name => {
    setItemsByCategory(itemsByCategory => ({ ...itemsByCategory, [name]: [] }))
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
      <List sx={{ pt: 0, pb: 8 }}>
        {Object.keys(itemsByCategory).map(category => (
          <div key={category}>
            <ItemCategory name={category} />

            {(list.is_template || isEditing) && (
              <MaterialListItem divider>
                <ListItemInput
                  onChange={name => handleCreateItem(name, category)}
                />
              </MaterialListItem>
            )}

            {itemsByCategory[category].length === 0 ? (
              <MaterialListItem>
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No hi ha elements
                </Typography>
              </MaterialListItem>
            ) : (
              itemsByCategory[category].map(item => (
                <ListItem
                  key={item.id}
                  list={list}
                  item={item}
                  isEditing={list.is_template || isEditing}
                  onChange={refreshList}
                />
              ))
            )}
          </div>
        ))}

        {(list.is_template || isEditing) && (
          <ItemCategory name="" editable onChange={handleCreateCategory} />
        )}
      </List>
    </>
  )
}

export default ListDetail
