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
import { ArrowBack, Logout } from '@mui/icons-material'
import { useAuth } from './auth/AuthProvider'
import { useHeader } from './HeaderProvider'
import { Helmet } from 'react-helmet'

function Layout() {
  const { isLoggedIn, logOut } = useAuth()
  const { title, backLink } = useHeader()

  return (
    <>
      <Helmet>
        <title>Família</title>{' '}
        <meta name="description" content="Gestor familiar" />
      </Helmet>
      <Box
        sx={{
          height: '100%',
          bgcolor: 'background.default',
        }}
      >
        <Container
          maxWidth="sm"
          disableGutters
          css={{ height: '100%', position: 'relative' }}
        >
          <Stack direction="column" css={{ height: '100%' }}>
            <header>
              <AppBar position="static">
                <Toolbar sx={{ gap: 1 }}>
                  {backLink && (
                    <IconButton component={RouterLink} to={backLink}>
                      <ArrowBack />
                    </IconButton>
                  )}
                  <Typography
                    variant="h6"
                    component="div"
                    noWrap
                    sx={{ flexGrow: 1 }}
                  >
                    <Link
                      component={RouterLink}
                      to={backLink || '/'}
                      color="inherit"
                      underline="none"
                    >
                      {title || 'Família'}
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
            <Paper elevation={0} sx={{ flexGrow: 1, overflowY: 'scroll' }}>
              <Outlet />
            </Paper>
          </Stack>
        </Container>
      </Box>
    </>
  )
}

export default Layout
