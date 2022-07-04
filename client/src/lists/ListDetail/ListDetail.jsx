import React, { useEffect, useState } from 'react'
import {
  Container,
  IconButton,
  List,
  ListItem as MaterialListItem,
  Typography,
} from '@mui/material'
import { useParams } from 'react-router-dom'
import LoadingScreen from 'LoadingScreen'
import { useLayout } from 'HeaderProvider'
import useClient from 'useClient'
import ListItem from './ListItem'
import { useCallback } from 'react'
import ListItemInput from './ListItemInput'
import { Helmet } from 'react-helmet-async'
import { Done, Edit } from '@mui/icons-material'
import ItemCategory from 'lists/ItemCategory'
import { useFamilies } from 'families/FamilyProvider'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

const move = (source, destination, droppableSource, droppableDestination) => {
  const sourceClone = Array.from(source)
  const destClone = Array.from(destination)
  const [removed] = sourceClone.splice(droppableSource.index, 1)

  destClone.splice(droppableDestination.index, 0, removed)

  const result = {}
  result[droppableSource.droppableId] = sourceClone
  result[droppableDestination.droppableId] = destClone

  return result
}

const ListDetail = () => {
  const params = useParams()
  const [list, setList] = useState()
  const [itemsByCategory, setItemsByCategory] = useState()
  const [isEditing, setIsEditing] = useState(false)
  const { setHeader } = useLayout()
  const { listRequest, itemsRequest } = useClient()
  const { currentFamilyId } = useFamilies()

  const toggleIsEditing = () => {
    setIsEditing(!isEditing)
  }

  const refreshList = useCallback(() => {
    if (!params.listId || currentFamilyId === undefined) {
      return
    }

    const listId = params.listId

    listRequest(currentFamilyId, listId)
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
  }, [params.listId, currentFamilyId])

  useEffect(() => {
    refreshList()
  }, [refreshList])

  useEffect(() => {
    if (list !== undefined) {
      setHeader(
        list.name,
        `/f/${currentFamilyId}/l/${list.is_template ? 'templates' : 'lists'}`,
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
    itemsRequest(currentFamilyId, list.id, {
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

  const updateItems = items => {
    listRequest(currentFamilyId, list.id, {
      method: 'PATCH',
      body: JSON.stringify({ items }),
      headers: { 'Content-Type': 'application/json' },
    }).then(refreshList)
  }

  const onDragEnd = result => {
    const { source, destination } = result

    // dropped outside the list
    if (!destination) {
      return
    }

    if (source.droppableId === destination.droppableId) {
      const items = reorder(
        itemsByCategory[source.droppableId],
        source.index,
        destination.index
      )

      setItemsByCategory({ ...itemsByCategory, [source.droppableId]: items })

      updateItems(
        items.map((item, index) => ({ id: item.id, order: index + 1 }))
      )
    } else {
      const result = move(
        itemsByCategory[source.droppableId],
        itemsByCategory[destination.droppableId],
        source,
        destination
      )

      setItemsByCategory({
        ...itemsByCategory,
        [source.droppableId]: result[source.droppableId],
        [destination.droppableId]: result[destination.droppableId],
      })

      updateItems([
        ...result[source.droppableId].map((item, index) => ({
          id: item.id,
          category: source.droppableId,
          order: index + 1,
        })),
        ...result[destination.droppableId].map((item, index) => ({
          id: item.id,
          category: destination.droppableId,
          order: index + 1,
        })),
      ])
    }
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

      {!(list.is_template || isEditing) && list.items.length === 0 ? (
        <Container sx={{ mt: 2 }}>
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No hi ha cap element a la llista
          </Typography>
        </Container>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <List sx={{ pt: 0, pb: 8 }}>
            {Object.keys(itemsByCategory).map(category => (
              <Droppable key={category} droppableId={category}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    sx={{
                      backgroundColor: snapshot.isDraggingOver
                        ? 'red'
                        : 'inherit',
                    }}
                  >
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
                        <Typography
                          color="text.secondary"
                          sx={{ fontStyle: 'italic' }}
                        >
                          No hi ha elements
                        </Typography>
                      </MaterialListItem>
                    ) : (
                      itemsByCategory[category].map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={String(item.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <ListItem
                                list={list}
                                item={item}
                                isEditing={list.is_template || isEditing}
                                onChange={refreshList}
                                sx={{
                                  backgroundColor: snapshot.isDragging
                                    ? 'green'
                                    : 'inherit',
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}

            {(list.is_template || isEditing) && (
              <ItemCategory name="" editable onChange={handleCreateCategory} />
            )}
          </List>
        </DragDropContext>
      )}
    </>
  )
}

export default ListDetail
