import React from 'react'
import { List, ListItemButton, ListItemText } from '@mui/material'
import { useFamilies } from './FamilyProvider'

const FamilyList = () => {
  const { families, currentFamilyId } = useFamilies()

  return (
    <List component="div" disablePadding>
      {families !== undefined &&
        families.map(family => (
          <ListItemButton
            key={family.id}
            selected={family.id === currentFamilyId}
            sx={{ pl: 4 }}
          >
            <ListItemText>{family.name}</ListItemText>
          </ListItemButton>
        ))}
    </List>
  )
}

export default FamilyList
