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
import { useTitle } from '../TitleProvider'
import { DeleteForever, Favorite, Share } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'

const Lists = () => {
  const [lists, setLists] = useState()
  const { setTitle } = useTitle()

  useEffect(() => {
    // TODO use current family id
    fetch(`${process.env.REACT_APP_API_URL}/families/1/lists/`)
      .then(res => res.json())
      .catch(e => console.log('Error loading lists', e))
      .then(data => setLists(data))
  }, [])

  useEffect(() => {
    setTitle('Llistes')
  }, [setTitle])

  if (lists === undefined) {
    return <LoadingScreen />
  }

  return (
    <Container>
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
                  <Typography variant="h6" component="h3" noWrap>
                    {list.name}
                  </Typography>
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
