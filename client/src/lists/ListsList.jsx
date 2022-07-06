import { Add } from '@mui/icons-material'
import { Container, Fab, Grid, Typography } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import { useLayout } from 'HeaderProvider'
import EditListDialog from './EditListDialog'
import ListPreview from './ListPreview'
import PropTypes from 'prop-types'
import { LIST_TYPE_LISTS, LIST_TYPE_TEMPLATES } from './constants'
import { useLists } from './ListsProvider'
import { Helmet } from 'react-helmet-async'
import LoadingScreen from 'LoadingScreen'
import { useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack'

const ListsList = ({ type }) => {
  const [isCreating, setIsCreating] = useState(false)
  const { setHeader, setFab } = useLayout()
  const { lists: allLists, refreshLists, createList } = useLists()
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

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

  const startCreatingList = () => {
    setIsCreating(true)
  }

  useEffect(() => {
    setFab(
      <Fab
        onClick={startCreatingList}
        color="primary"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        className="umami-click-lists-new"
      >
        <Add />
      </Fab>
    )

    return () => setFab(undefined)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setHeader(title)
  }, [title, setHeader])

  if (lists === undefined) {
    return <LoadingScreen />
  }

  const handleCreate = async data => {
    return createList(data).then(() => {
      setIsCreating(false)
      refreshLists()
      enqueueSnackbar('Creada correctament')

      const targetType = data.is_template
        ? LIST_TYPE_TEMPLATES
        : LIST_TYPE_LISTS
      if (targetType !== type) {
        navigate(`/lists/${targetType}`)
      }
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

      {lists.length === 0 ? (
        <Container sx={{ mt: 2 }}>
          <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No hi ha cap {type === LIST_TYPE_LISTS ? 'llista' : 'plantilla'}, en
            pots crear amb el botó de baix a la dreta.
          </Typography>
        </Container>
      ) : (
        <Grid container direction="column" spacing={2} sx={{ p: 2 }}>
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
      )}

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
