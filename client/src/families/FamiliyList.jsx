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
import { Add, PeopleAlt, Settings } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useState } from 'react'
import EditFamilyDialog from './EditFamilyDialog'
import useClient from '../useClient'

const FamilyList = ({ onClose }) => {
  const { families, currentFamilyId } = useFamilies()
  const [isCreatingFamily, setIsCreatingFamily] = useState(false)
  const { familiesRequest } = useClient()

  const createFamily = async data => {
    familiesRequest({
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const startCreatingFamily = () => {
    setIsCreatingFamily(true)
  }

  const stopCreatingFamily = () => {
    setIsCreatingFamily(false)
  }

  return (
    <>
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
        <ListItemButton sx={{ pl: 4, pr: 1 }} onClick={startCreatingFamily}>
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText>Nova família</ListItemText>
        </ListItemButton>
      </List>
      <EditFamilyDialog
        title="Nova família"
        open={isCreatingFamily}
        onSave={createFamily}
        onClose={stopCreatingFamily}
      />
    </>
  )
}

FamilyList.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default FamilyList
