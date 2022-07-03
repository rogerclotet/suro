import React from 'react'
import PropTypes from 'prop-types'
import {
  Checkbox,
  ListItem as MaterialListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import useClient from 'useClient'
import ListItemInput from './ListItemInput'
import { useFamilies } from 'families/FamilyProvider'

const ListItem = ({ list, item, isEditing, onChange }) => {
  const { itemRequest } = useClient()
  const { currentFamilyId } = useFamilies()

  const handleComplete = () => {
    itemRequest(currentFamilyId, list.id, item.id, {
      method: 'PATCH',
      body: JSON.stringify({ is_complete: !item.is_complete }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (res.status === 200) {
        onChange()
      }
    })
  }

  const handleChangeName = () => {
    itemRequest(currentFamilyId, list.id, item.id, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (res.status === 200) {
        onChange()
      } else {
        console.log('Error saving name', res.status)
      }
    })
  }

  return (
    <MaterialListItem
      divider
      secondaryAction={
        list.is_template ? null : (
          <Checkbox
            edge="end"
            onChange={handleComplete}
            checked={item.is_complete}
          />
        )
      }
    >
      {!isEditing || item.is_complete ? (
        <ListItemText>
          <Typography
            color={item.is_complete ? 'text.secondary' : undefined}
            sx={{
              textDecoration: item.is_complete ? 'line-through' : undefined,
            }}
          >
            {item.name}
          </Typography>
        </ListItemText>
      ) : (
        <ListItemInput initialValue={item.name} onChange={handleChangeName} />
      )}
    </MaterialListItem>
  )
}

ListItem.propTypes = {
  list: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default ListItem
