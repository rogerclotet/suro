import React from 'react'
import {
  Badge,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from '@mui/material'
import { useFamilies } from './FamilyProvider'
import { PeopleAlt, Settings } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

const FamilyList = ({ onClose }) => {
  const { families, currentFamilyId } = useFamilies()

  return (
    <List component="div" disablePadding>
      {families !== undefined &&
        families.map(family => (
          <ListItemButton
            key={family.id}
            selected={family.id === currentFamilyId}
            sx={{ pl: 4, pr: 1 }}
          >
            <ListItemIcon>
              <Badge badgeContent={family.members.length}>
                <PeopleAlt />
              </Badge>
            </ListItemIcon>
            <Stack
              direction="row"
              justifyContent="space-between"
              gap={1}
              flexGrow={1}
            >
              <ListItemText>{family.name}</ListItemText>
              <IconButton
                size="small"
                onClick={onClose}
                component={Link}
                to={`/family/${family.id}`}
              >
                <Settings />
              </IconButton>
            </Stack>
          </ListItemButton>
        ))}
    </List>
  )
}

FamilyList.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default FamilyList
