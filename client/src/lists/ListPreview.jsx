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
import { DeleteForever, Favorite, Share } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import PropTypes from 'prop-types'
import useClient from '../useClient'

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

const ListPreview = ({ list }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const { listRequest } = useClient()

  const handleDeleteDialogClose = confirmed => {
    if (confirmed) {
      listRequest(list.id, { method: 'DELETE' })
        .then(() => setIsDeleting(false))
        .catch(e => console.log('Error deleting list', e))
    } else {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <Link
        component={RouterLink}
        to={`/lists/${list.id}`}
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
        <IconButton color={list.is_favorite ? 'secondary' : 'inherit'}>
          <Favorite />
        </IconButton>
        <IconButton>
          <Share />
        </IconButton>
        <IconButton onClick={() => setIsDeleting(true)}>
          <DeleteConfirmationDialog
            list={list}
            open={isDeleting}
            onClose={handleDeleteDialogClose}
          />
          <DeleteForever />
        </IconButton>
      </CardActions>
    </Card>
  )
}

ListPreview.propTypes = {
  list: PropTypes.object.isRequired,
}

export default ListPreview
