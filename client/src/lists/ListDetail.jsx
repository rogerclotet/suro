import {
  Checkbox,
  Container,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import LoadingScreen from '../LoadingScreen'
import { useHeader } from '../HeaderProvider'

const ListDetail = () => {
  const params = useParams()
  const [list, setList] = useState()
  const { setHeader } = useHeader()
  const { token } = useAuth()

  useEffect(() => {
    if (!token || !params.listId) {
      return
    }

    const listId = params.listId

    // TODO use current family id
    fetch(`${process.env.REACT_APP_API_URL}/families/1/lists/${listId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .catch(e => console.log('Error loading list detail', e))
      .then(data => setList(data))
  }, [params, token])

  useEffect(() => {
    if (list !== undefined) {
      setHeader(list.name, '/lists')
    }
  }, [list, setHeader])

  if (list === undefined) {
    return <LoadingScreen />
  }

  if (list.items.length === 0) {
    return (
      <Container sx={{ py: 2 }}>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontStyle: 'italic' }}
        >
          No hi ha elements a la llista.
        </Typography>
      </Container>
    )
  }

  return (
    <List>
      {list.items.map(item => (
        <ListItem
          key={item.id}
          divider
          secondaryAction={
            <Checkbox
              edge="end"
              onChange={() => {}}
              checked={item.is_complete}
            />
          }
        >
          <ListItemText>
            <Typography
              color={item.is_complete ? 'text.secondary' : 'inherit'}
              sx={{ textDecoration: item.is_complete ? 'line-through' : '' }}
            >
              {item.name}
            </Typography>
          </ListItemText>
        </ListItem>
      ))}
    </List>
  )
}

export default ListDetail
