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
  Drawer,
} from '@mui/material'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { ArrowBack, Menu } from '@mui/icons-material'
import { useAuth } from './auth/AuthProvider'
import { useHeader } from './HeaderProvider'
import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import SideMenu from './SideMenu'

const drawerWidth = 240

const Layout = () => {
  const { isLoggedIn } = useAuth()
  const { title, backLink } = useHeader()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleDrawerToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const container =
    window !== undefined ? () => window.document.body : undefined

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
                  {isLoggedIn && (
                    <IconButton
                      size="large"
                      edge="start"
                      onClick={handleDrawerToggle}
                    >
                      <Menu />
                    </IconButton>
                  )}
                  {backLink && (
                    <IconButton component={RouterLink} to={backLink}>
                      <ArrowBack />
                    </IconButton>
                  )}
                  <Typography
                    variant="h6"
                    component="h2"
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
                </Toolbar>
              </AppBar>
            </header>
            <Paper elevation={0} sx={{ flexGrow: 1, overflowY: 'scroll' }}>
              <Outlet />
            </Paper>
          </Stack>
        </Container>
      </Box>
      <Drawer
        container={container}
        variant="temporary"
        open={isMenuOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        <SideMenu />
      </Drawer>
    </>
  )
}

export default Layout
