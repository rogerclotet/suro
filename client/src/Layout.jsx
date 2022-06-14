/** @jsxImportSource @emotion/react */
import React from 'react'
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  Stack,
  IconButton,
  Link,
} from '@mui/material'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { Logout } from '@mui/icons-material'
import { useAuth } from './auth/AuthProvider'
import { useTitle } from './TitleProvider'

function Layout() {
  const { isLoggedIn, logOut } = useAuth()
  const { title } = useTitle()

  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm" disableGutters css={{ height: '100%' }}>
        <Stack direction="column" css={{ height: '100%' }}>
          <header>
            <AppBar position="static" css={{ marginBottom: '1em' }}>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  <Link
                    component={RouterLink}
                    to="/"
                    color="inherit"
                    underline="none"
                  >
                    {title}
                  </Link>
                </Typography>
                {isLoggedIn && (
                  <IconButton onClick={logOut}>
                    <Logout />
                  </IconButton>
                )}
              </Toolbar>
            </AppBar>
          </header>
          <Paper elevation={0} sx={{ flexGrow: 1 }}>
            <Outlet />
          </Paper>
        </Stack>
      </Container>
    </Box>
  )
}

export default Layout
