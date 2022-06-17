import React, { useCallback, useEffect, useState } from 'react'
import { Box, Grid, Tab } from '@mui/material'
import LoadingScreen from '../LoadingScreen'
import { useHeader } from '../HeaderProvider'
import ListPreview from './ListPreview'
import NewListButton from './NewListButton'
import useClient from '../useClient'
import { Helmet } from 'react-helmet-async'
import { TabContext, TabList, TabPanel } from '@mui/lab'

const Lists = () => {
  const [lists, setLists] = useState()
  const [templates, setTemplates] = useState()
  const { setHeader } = useHeader()
  const { listsRequest } = useClient()
  const [tab, setTab] = useState('lists')

  const refreshLists = useCallback(() => {
    listsRequest()
      .then(res =>
        res.json().then(data => {
          const newLists = []
          const newTemplates = []
          data.forEach(list => {
            if (list.is_template) {
              newTemplates.push(list)
            } else {
              newLists.push(list)
            }
          })
          setLists(newLists)
          setTemplates(newTemplates)
        })
      )
      .catch(e => console.log('Error loading lists', e))
  }, [listsRequest])

  useEffect(() => {
    refreshLists()
  }, [refreshLists])

  useEffect(() => {
    setHeader('Llistes')
  }, [setHeader])

  if (lists === undefined || templates === undefined) {
    return <LoadingScreen />
  }

  const handleTabChange = (event, value) => {
    setTab(value)
  }

  return (
    <>
      <Helmet>
        <title>Llistes</title>
        <meta name="description" content="Gestor familiar de llistes" />
      </Helmet>

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} variant="fullWidth">
            <Tab label="Llistes" value="lists" />
            <Tab label="Plantilles" value="templates" />
          </TabList>
        </Box>
        <TabPanel value="lists">
          <Grid container direction="column" spacing={2} sx={{ pb: 8 }}>
            {lists.map(list => (
              <Grid item key={list.id}>
                <ListPreview list={list} onChange={refreshLists} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>
        <TabPanel value="templates">
          <Grid container direction="column" spacing={2} sx={{ pb: 8 }}>
            {templates.map(list => (
              <Grid item key={list.id}>
                <ListPreview list={list} onChange={refreshLists} />
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </TabContext>

      <NewListButton onClose={refreshLists} />
    </>
  )
}

export default Lists
