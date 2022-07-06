import React from 'react'
import PropTypes from 'prop-types'
import { IconButton, Menu, MenuItem } from '@mui/material'
import { MoreVert } from '@mui/icons-material'
import { useState } from 'react'
import EditListDialog from 'lists/EditListDialog'

const ListDetailMenu = ({ list, onListChange }) => {
  const [anchorEl, setAnchorEl] = useState()
  const isOpen = Boolean(anchorEl)

  const [isEditing, setIsEditing] = useState(false)

  const saveEditedList = async list => {
    setIsEditing(false)

    return onListChange({
      id: list.id,
      name: list.name,
      description: list.description,
    })
  }

  const openMenu = event => {
    setAnchorEl(event.currentTarget)
  }

  const openListEditDialog = () => {
    setAnchorEl(undefined)
    setIsEditing(true)
  }

  return (
    <>
      <IconButton size="large" edge="end" onClick={openMenu}>
        <MoreVert />
      </IconButton>

      <Menu
        open={isOpen}
        onClose={() => setAnchorEl(undefined)}
        anchorEl={anchorEl}
      >
        <MenuItem onClick={openListEditDialog}>Opcions</MenuItem>
      </Menu>

      <EditListDialog
        title="Editar llista"
        initialValues={list}
        open={isEditing}
        onSave={saveEditedList}
        onCancel={() => setIsEditing(false)}
        disableTypeChanges
      />
    </>
  )
}

ListDetailMenu.propTypes = {
  list: PropTypes.object.isRequired,
  onListChange: PropTypes.func.isRequired,
}

export default ListDetailMenu
