import React, { useCallback, useEffect, useState } from 'react'
import { Container, Grid } from '@mui/material'
import LoadingScreen from '../LoadingScreen'
import { useHeader } from '../HeaderProvider'
import ListPreview from './ListPreview'
import NewListButton from './NewListButton'
import useClient from '../useClient'

const Lists = () => {
  const [lists, setLists] = useState()
  const { setHeader } = useHeader()
  const { listsRequest } = useClient()

  const refreshLists = useCallback(() => {
    listsRequest()
      .then(res => res.json())
      .catch(e => console.log('Error loading lists', e))
      .then(data => setLists(data))
  }, [listsRequest])

  useEffect(() => {
    refreshLists()
  }, [])

  useEffect(() => {
    setHeader('Llistes')
  }, [setHeader])

  if (lists === undefined) {
    return <LoadingScreen />
  }

  return (
    <Container sx={{ pt: 2, pb: 11 }}>
      <Grid container direction="column" spacing={2}>
        {lists.map(list => (
          <Grid item key={list.id}>
            <ListPreview list={list} onChange={refreshLists} />
          </Grid>
        ))}
      </Grid>
      <NewListButton onClose={refreshLists} />
    </Container>
  )
}

export default Lists
