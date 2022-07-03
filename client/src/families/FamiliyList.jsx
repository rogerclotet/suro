import React from 'react'
import {
  Badge,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
} from '@mui/material'
import { useFamilies } from './FamilyProvider'
import { Add, PeopleAlt, Settings } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import { useState } from 'react'
import EditFamilyDialog from './EditFamilyDialog'
import useClient from 'useClient'

const FAMILIES_LIMIT = 5

const FamilyList = ({ onClose }) => {
  const { families, currentFamilyId, setCurrentFamilyId, refreshFamilies } =
    useFamilies()
  const [isCreatingFamily, setIsCreatingFamily] = useState(false)
  const { familiesRequest } = useClient()
  const navigate = useNavigate()

  const createFamily = async data => {
    familiesRequest({
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (res.status === 200) {
        res.json().then(data => {
          refreshFamilies().then(() => navigate(`/f/${data.id}/l`))
        })
      } else {
        console.log('Error creating family', res)
      }
    })
  }

  const startCreatingFamily = () => {
    setIsCreatingFamily(true)
  }

  const stopCreatingFamily = () => {
    setIsCreatingFamily(false)
  }

  const selectFamily = familyId => {
    setCurrentFamilyId(familyId)
    navigate(`/f/${familyId}/l`)
    onClose()
  }

  const openFamilySettings = familyId => {
    navigate(`/f/${familyId}`)
    onClose()
  }

  return (
    <>
      <List component="div" disablePadding>
        {families !== undefined &&
          families.map(family => (
            <ListItem
              key={family.id}
              disablePadding
              selected={family.id === currentFamilyId}
              sx={{ '&:hover': { backgroundColor: 'divider' } }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                flexGrow={1}
              >
                <ListItemButton
                  onClick={() => selectFamily(family.id)}
                  sx={{
                    pl: 4,
                    pr: 1,
                    gap: 2,
                    '&:hover': { backgroundColor: 'inherit' },
                  }}
                  component="span"
                >
                  <Badge badgeContent={family.members.length}>
                    <PeopleAlt />
                  </Badge>
                  <ListItemText>{family.name}</ListItemText>
                </ListItemButton>

                <IconButton
                  size="small"
                  onClick={() => openFamilySettings(family.id)}
                >
                  <Settings />
                </IconButton>
              </Stack>
            </ListItem>
          ))}
        <ListItemButton sx={{ pl: 4, pr: 1 }} onClick={startCreatingFamily}>
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText>Nova família</ListItemText>
        </ListItemButton>
      </List>

      {families.length < FAMILIES_LIMIT && (
        <EditFamilyDialog
          title="Nova família"
          open={isCreatingFamily}
          onSave={createFamily}
          onClose={stopCreatingFamily}
        />
      )}
    </>
  )
}

FamilyList.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default FamilyList
