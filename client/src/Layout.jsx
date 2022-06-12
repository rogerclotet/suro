/** @jsxImportSource @emotion/react */
import React from 'react'
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
} from '@mui/material'
import PropTypes from 'prop-types'
import { Outlet } from 'react-router-dom'

function Layout({ title }) {
  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm" disableGutters css={{ height: '100%' }}>
        <header>
          <AppBar position="static" css={{ marginBottom: '1em' }}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {title || 'Família'}
              </Typography>
            </Toolbar>
          </AppBar>
        </header>
        <Paper elevation={0}>
          <Outlet />
        </Paper>
      </Container>
    </Box>
  )
}

Layout.propTypes = {
  title: PropTypes.string,
}

export default Layout
