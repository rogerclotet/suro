import React from 'react'
import { CircularProgress, Stack } from '@mui/material'

const LoadingScreen = () => {
  return (
    <Stack height="100%" justifyContent="center" alignItems="center">
      <CircularProgress color="primary" />
    </Stack>
  )
}

export default LoadingScreen
