/** @jsxImportSource @emotion/react */
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import CssBaseline from '@mui/material/CssBaseline'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { createTheme, ThemeProvider } from '@mui/material'
import { blueGrey, lightGreen } from '@mui/material/colors'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './auth/AuthProvider'
import HeaderProvider from './HeaderProvider'
import { HelmetProvider } from 'react-helmet-async'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: blueGrey[500],
    },
    secondary: {
      main: lightGreen[500],
    },
  },
})

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <HelmetProvider>
          <HeaderProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </HeaderProvider>
        </HelmetProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
