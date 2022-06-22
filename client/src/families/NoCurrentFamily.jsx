import { Container, Typography } from '@mui/material'
import React from 'react'

const NoCurrentFamily = () => {
  return (
    <Container sx={{ py: 2 }}>
      <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
        No ets a cap família
      </Typography>
      <Typography variant="body1">
        Pots unir-te a una família obrint un enllaç d&apos;invitació o crear una
        família des del menú lateral.
      </Typography>
    </Container>
  )
}

export default NoCurrentFamily
