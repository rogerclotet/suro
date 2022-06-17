import React from 'react'
import PropTypes from 'prop-types'
import { InputBase, ListSubheader } from '@mui/material'
import { useState } from 'react'

const ItemCategory = ({ name, editable, onChange }) => {
  const [editingName, setEditingName] = useState(name)

  const handleChangeName = event => {
    setEditingName(event.target.value)
  }

  const handleSubmit = event => {
    event.preventDefault()
    handleSaveName()
  }

  const handleSaveName = () => {
    onChange(editingName)
    setEditingName('')
  }

  return (
    <ListSubheader
      sx={{
        backgroundColor: '#2f2f2f', // Divider color without opacity
      }}
    >
      {editable ? (
        <form onSubmit={handleSubmit}>
          <InputBase
            value={editingName}
            onChange={handleChangeName}
            placeholder="Afegeix una categoria"
            onBlur={handleSaveName}
            fullWidth
          />
        </form>
      ) : name === '' ? (
        'Sense categoria'
      ) : (
        name
      )}
    </ListSubheader>
  )
}

ItemCategory.propTypes = {
  name: PropTypes.string.isRequired,
  editable: PropTypes.bool,
  onChange: PropTypes.func,
}

export default ItemCategory
