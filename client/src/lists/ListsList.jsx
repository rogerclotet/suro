import { Add } from '@mui/icons-material'
import { Fab, Grid } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import { useHeader } from '../HeaderProvider'
import EditListDialog from './EditListDialog'
import ListPreview from './ListPreview'
import PropTypes from 'prop-types'
import { LIST_TYPE_LISTS } from './constants'
import { useLists } from './ListsProvider'
import { Helmet } from 'react-helmet-async'
import LoadingScreen from '../LoadingScreen'

const ListsList = ({ type }) => {
  const [isCreating, setIsCreating] = useState(false)
  const { setHeader } = useHeader()
  const { lists: allLists, refreshLists, createList } = useLists()

  const title = useMemo(
    () => (type === LIST_TYPE_LISTS ? 'Llistes' : 'Plantilles'),
    [type]
  )

  const lists = useMemo(() => {
    if (!allLists) {
      return undefined
    }

    return type === LIST_TYPE_LISTS
      ? allLists.filter(list => !list.is_template)
      : allLists.filter(list => list.is_template)
  }, [type, allLists])

  useEffect(() => {
    setHeader(title)
  }, [title, setHeader])

  if (lists === undefined) {
    return <LoadingScreen />
  }

  const startCreatingList = () => {
    setIsCreating(true)
  }

  const handleCreate = () => {
    createList().then(() => {
      setIsCreating(false)
      refreshLists()
    })
  }

  const handleCancelCreating = () => {
    setIsCreating(false)
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content="Gestor familiar de llistes" />
      </Helmet>

      <Grid container direction="column" spacing={2} sx={{ p: 2, pb: 8 }}>
        {lists.map(list => (
          <Grid item key={list.id}>
            <ListPreview
              list={list}
              onChange={refreshLists}
              onDuplicate={refreshLists}
            />
          </Grid>
        ))}
      </Grid>

      <Fab
        onClick={startCreatingList}
        color="primary"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
      >
        <Add />
      </Fab>

      <EditListDialog
        title="Llista nova"
        open={isCreating}
        onSave={handleCreate}
        onCancel={handleCancelCreating}
      />
    </>
  )
}

ListsList.propTypes = {
  type: PropTypes.string.isRequired,
}

export default ListsList
