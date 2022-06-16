import { ExpandLess, ExpandMore, Logout, PeopleAlt } from '@mui/icons-material'
import {
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import React from 'react'
import { useState } from 'react'
import { useAuth } from './auth/AuthProvider'

const SideMenu = () => {
  const [isFamilyOpen, setIsFamilyOpen] = useState(false)
  const { logOut } = useAuth()

  const handleToggleFamily = () => {
    setIsFamilyOpen(!isFamilyOpen)
  }

  const handleLogOut = () => {
    setIsFamilyOpen(false)
    logOut()
  }

  return (
    <>
      <Toolbar>
        <Typography variant="h6" component="h2">
          Família
        </Typography>
      </Toolbar>
      <Divider />
      <List component="nav">
        <ListItemButton onClick={handleToggleFamily}>
          <ListItemIcon>
            <PeopleAlt />
          </ListItemIcon>
          <ListItemText>Família</ListItemText>
          {isFamilyOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={isFamilyOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton selected sx={{ pl: 4 }}>
              <ListItemText>Cullell Clotet</ListItemText>
            </ListItemButton>
          </List>
        </Collapse>
        <ListItemButton onClick={handleLogOut}>
          <ListItemIcon>
            <Logout />
          </ListItemIcon>
          <ListItemText>Tancar la sessió</ListItemText>
        </ListItemButton>
      </List>
    </>
  )
}

export default SideMenu
