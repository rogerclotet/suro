import React, { useCallback, useEffect, useState } from 'react'
import { Container, Grid } from '@mui/material'
import LoadingScreen from '../LoadingScreen'
import { useHeader } from '../HeaderProvider'
import { useAuth } from '../auth/AuthProvider'
import ListPreview from './ListPreview'
import NewListButton from './NewListButton'

const Lists = () => {
  const [lists, setLists] = useState()
  const { setHeader } = useHeader()
  const { token } = useAuth()

  const refreshLists = useCallback(() => {
    fetch(`${process.env.REACT_APP_API_URL}/families/1/lists/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .catch(e => console.log('Error loading lists', e))
      .then(data => setLists(data))
  }, [token])

  useEffect(() => {
    // TODO use current family id
    if (token) {
      refreshLists()
    }
  }, [token, refreshLists])

  useEffect(() => {
    setHeader('Llistes')
  }, [setHeader])

  if (lists === undefined) {
    return <LoadingScreen />
  }

  return (
    <Container sx={{ py: 2 }}>
      <Grid container direction="column" spacing={2}>
        {lists.map(list => (
          <Grid item key={list.id}>
            <ListPreview list={list} />
          </Grid>
        ))}
      </Grid>
      <NewListButton onClose={refreshLists} />
    </Container>
  )
}

export default Lists
