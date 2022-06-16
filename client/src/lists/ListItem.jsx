import React from 'react'
import PropTypes from 'prop-types'
import {
  Checkbox,
  InputBase,
  ListItem as MaterialListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import useClient from '../useClient'

const ListItem = ({ list, item, onChange }) => {
  const [name, setName] = useState(item.name)
  const { itemRequest } = useClient()

  const handleChangeName = event => {
    setName(event.target.value)
  }

  const saveName = () => {
    if (name !== item.name) {
      itemRequest(list.id, item.id, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' },
      }).then(res => {
        if (res.status === 200) {
          onChange()
        }
      })
    }
  }

  const handleComplete = () => {
    itemRequest(list.id, item.id, {
      method: 'PATCH',
      body: JSON.stringify({ is_complete: !item.is_complete }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (res.status === 200) {
        onChange()
      }
    })
  }

  return (
    <MaterialListItem
      divider
      secondaryAction={
        <Checkbox
          edge="end"
          onChange={handleComplete}
          checked={item.is_complete}
        />
      }
    >
      {item.is_complete ? (
        <ListItemText>
          <Typography
            color={'text.secondary'}
            sx={{ textDecoration: 'line-through' }}
          >
            {item.name}
          </Typography>
        </ListItemText>
      ) : (
        <InputBase
          value={name}
          onChange={handleChangeName}
          fullWidth
          onBlur={saveName}
        />
      )}
    </MaterialListItem>
  )
}

ListItem.propTypes = {
  list: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default ListItem
