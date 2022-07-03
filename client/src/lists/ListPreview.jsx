import React, { useState } from 'react'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Link,
  Typography,
} from '@mui/material'
import {
  ContentCopy,
  DeleteForever,
  Favorite,
  Share,
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import useClient from 'useClient'
import { RWebShare } from 'react-web-share'
import EditListDialog from './EditListDialog'
import { useFamilies } from 'families/FamilyProvider'

const DeleteConfirmationDialog = ({ list, open, onClose }) => {
  const handleCancel = () => {
    onClose(false)
  }

  const handleOk = () => {
    onClose(true)
  }

  return (
    <Dialog open={open} onClose={handleCancel}>
      <DialogTitle>Confirmació</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Segur que vols eliminar la llista {list.title}?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          Canceŀlar
        </Button>
        <Button onClick={handleOk} color="error">
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

DeleteConfirmationDialog.propTypes = {
  list: PropTypes.object.isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
}

const ListPreview = ({ list, onChange, onDuplicate }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const { listRequest, listsRequest } = useClient()
  const { currentFamilyId } = useFamilies()

  const handleDeleteDialogClose = confirmed => {
    if (confirmed) {
      listRequest(list.id, { method: 'DELETE' }).then(res => {
        setIsDeleting(false)
        if (res.status === 204) {
          onChange()
        } else {
          console.log('Error deleting list', res.status)
        }
      })
    } else {
      setIsDeleting(false)
    }
  }

  const handleToggleFavorite = () => {
    listRequest(list.id, {
      method: 'PATCH',
      body: JSON.stringify({ is_favorite: !list.is_favorite }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (res.status === 200) {
        onChange()
      } else {
        console.log('Error toggling favorite')
      }
    })
  }

  const handleStartDuplicating = () => {
    setIsDuplicating(true)
  }

  const handleCancelDuplicating = () => {
    setIsDuplicating(false)
  }

  const handleDuplicate = async data => {
    return listsRequest(currentFamilyId, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(() => {
      onDuplicate()
      setIsDuplicating(false)
    })
  }

  return (
    <>
      <Card>
        <Link
          component={RouterLink}
          to={`/f/${currentFamilyId}/l/${list.id}`}
          underline="none"
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
          <IconButton
            onClick={handleToggleFavorite}
            color={list.is_favorite ? 'secondary' : 'inherit'}
          >
            <Favorite />
          </IconButton>
          <RWebShare
            data={{
              title: list.name,
              text: `${list.name}%0D%0A%0D%0A${
                list.description ? list.description + '%0D%0A' : ''
              }Llista amb ${list.items.length} elements.`,
              url: `${window.location.href}/${list.id}`,
            }}
          >
            <IconButton>
              <Share />
            </IconButton>
          </RWebShare>
          <IconButton onClick={handleStartDuplicating}>
            <ContentCopy />
          </IconButton>
          <IconButton onClick={() => setIsDeleting(true)}>
            <DeleteForever />
          </IconButton>
        </CardActions>
      </Card>
      <DeleteConfirmationDialog
        list={list}
        open={isDeleting}
        onClose={handleDeleteDialogClose}
      />
      <EditListDialog
        title="Duplicar llista"
        initialValues={list}
        open={isDuplicating}
        onCancel={handleCancelDuplicating}
        onSave={handleDuplicate}
      />
    </>
  )
}

ListPreview.propTypes = {
  list: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
}

export default ListPreview
