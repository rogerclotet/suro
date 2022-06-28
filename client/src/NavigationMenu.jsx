import React from 'react'
import { ListAlt } from '@mui/icons-material'
import { ListItemButton, ListItemIcon } from '@mui/material'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { useFamilies } from './families/FamilyProvider'

const NavigationMenu = ({ onClose }) => {
  const { currentFamilyId } = useFamilies()

  return (
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
  )
}

NavigationMenu.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default NavigationMenu
