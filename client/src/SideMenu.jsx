import React from 'react'
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
import { useState } from 'react'
import { useAuth } from './auth/AuthProvider'
import FamilyList from './families/FamiliyList'
import PropTypes from 'prop-types'
import NavigationMenu from './NavigationMenu'
import { useLayout } from './HeaderProvider'

const SideMenu = ({ onClose }) => {
  const [isFamilyOpen, setIsFamilyOpen] = useState(false)
  const { isLoggedIn, logOut } = useAuth()
  const { setTabs, setFab } = useLayout()

  const handleToggleFamily = () => {
    setIsFamilyOpen(!isFamilyOpen)
  }

  const handleLogOut = () => {
    // To avoid some issues with FamilyProvider not being present
    setTabs(undefined)
    setFab(undefined)

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
        {isLoggedIn && <NavigationMenu onClose={onClose} />}
        <ListItemButton onClick={handleToggleFamily}>
          <ListItemIcon>
            <PeopleAlt />
          </ListItemIcon>
          <ListItemText>Família</ListItemText>
          {isFamilyOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={isFamilyOpen} timeout="auto" unmountOnExit>
          <FamilyList onClose={onClose} />
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

SideMenu.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default SideMenu
