import {
  ExpandLess,
  ExpandMore,
  ListAlt,
  Logout,
  PeopleAlt,
} from '@mui/icons-material'
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
import FamilyList from './families/FamiliyList'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useFamilies } from './families/FamilyProvider'

const SideMenu = ({ onClose }) => {
  const [isFamilyOpen, setIsFamilyOpen] = useState(false)
  const { logOut } = useAuth()
  const { currentFamilyId } = useFamilies()

  const handleToggleFamily = () => {
    setIsFamilyOpen(!isFamilyOpen)
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
        {currentFamilyId !== undefined && (
          <ListItemButton
            onClick={onClose}
            component={Link}
            to={`/f/${currentFamilyId}/l/lists`}
          >
            <ListItemIcon>
              <ListAlt />
            </ListItemIcon>
            Llistes
          </ListItemButton>
        )}
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
        <ListItemButton onClick={logOut}>
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
