import React from 'react'
import {
  Badge,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { useFamilies } from './FamilyProvider'
import { PeopleAlt } from '@mui/icons-material'

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
            <ListItemIcon>
              <Badge badgeContent={family.members.length}>
                <PeopleAlt />
              </Badge>
            </ListItemIcon>
            <ListItemText>{family.name}</ListItemText>
          </ListItemButton>
        ))}
    </List>
  )
}

export default FamilyList
