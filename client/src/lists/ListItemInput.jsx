/** @jsxImportSource @emotion/react */
import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { InputBase } from '@mui/material'

const ListItemInput = ({ initialValue, onChange }) => {
  const [name, setName] = useState(initialValue || '')

  const handleChangeName = event => {
    setName(event.target.value)
  }

  const saveName = () => {
    if (name !== '' && name !== initialValue) {
      onChange(name)

      if (initialValue === undefined) {
        setName('')
      }
    }
  }

  const handleSubmit = event => {
    event.preventDefault()
    saveName()
  }

  return (
    <form onSubmit={handleSubmit} css={{ width: '100%' }}>
      <InputBase
        value={name}
        onChange={handleChangeName}
        placeholder={initialValue === undefined ? 'Afegeix un element' : ''}
        onBlur={saveName}
        fullWidth
      />
    </form>
  )
}

ListItemInput.propTypes = {
  initialValue: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

export default ListItemInput
