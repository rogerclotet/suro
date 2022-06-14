import React, { useEffect, useState } from 'react'
import {
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  IconButton,
  Link,
  Typography,
} from '@mui/material'
import LoadingScreen from '../LoadingScreen'
import { useHeader } from '../HeaderProvider'
import { DeleteForever, Favorite, Share } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

const Lists = () => {
  const [lists, setLists] = useState()
  const { setHeader } = useHeader()
  const { token } = useAuth()

  useEffect(() => {
    // TODO use current family id
    fetch(`${process.env.REACT_APP_API_URL}/families/1/lists/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .catch(e => console.log('Error loading lists', e))
      .then(data => setLists(data))
  }, [token])

  useEffect(() => {
    setHeader('Llistes')
  }, [setHeader])

  if (lists === undefined) {
    return <LoadingScreen />
  }

  return (
    <Container sx={{ py: 2 }}>
      <Grid container spacing={2}>
        {lists.map(list => (
          <Grid item xs={6} key={list.id}>
            <Card>
              <Link
                component={RouterLink}
                to={`/lists/${list.id}`}
                underline="hover"
                color="inherit"
              >
                <CardContent>
                  <Typography variant="h7" component="h3">
                    {list.name}
                  </Typography>
                  {list.description && (
                    <Typography variant="subtitle1" color="text.secondary">
                      {list.description}
                    </Typography>
                  )}
                  <Typography variant="body2">{`${list.items.length} elements`}</Typography>
                </CardContent>
              </Link>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <IconButton color={list.is_favorite ? 'secondary' : 'inherit'}>
                  <Favorite />
                </IconButton>
                <IconButton>
                  <Share />
                </IconButton>
                <IconButton>
                  <DeleteForever />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}

export default Lists
