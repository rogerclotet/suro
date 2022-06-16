import React from 'react'
import { List, ListItemButton, ListItemText } from '@mui/material'

const FamilyList = () => {
  return (
    <List component="div" disablePadding>
      <ListItemButton selected sx={{ pl: 4 }}>
        <ListItemText>Cullell Clotet</ListItemText>
      </ListItemButton>
    </List>
  )
}

export default FamilyList
