/** @jsxImportSource @emotion/react */
import React, { useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { useAuth } from './AuthProvider'
import { useHeader } from '../HeaderProvider'

const validationSchema = yup.object({
  email: yup
    .string('Introdueix un email')
    .email('Introdueix un email vàlid')
    .required("L'email és obligatori"),
  password: yup
    .string('Introdueix la contrasenya')
    .min(8, 'La contrasenya ha de tenir 8 caràcters com a mínim')
    // TODO Add validations to match backend
    .required('La contrasenya és obligatòria'),
})

const Login = () => {
  const { logIn } = useAuth()
  const { setHeader } = useHeader()
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: ({ email, password }) => logIn(email, password),
  })

  useEffect(() => {
    setHeader(undefined)
  }, [setHeader])

  return (
    <Container sx={{ height: '100%' }}>
      <Stack height="100%" justifyContent="center" alignItems="center">
        <Card>
          <CardContent>
            <Typography variant="h4" component="h2" marginBottom={2}>
              Iniciar sessió
            </Typography>
            <form onSubmit={formik.handleSubmit}>
              <Stack direction="column" gap={2}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Contrasenya"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.password && Boolean(formik.errors.password)
                  }
                  helperText={formik.touched.password && formik.errors.password}
                />
                <Button
                  color="primary"
                  variant="contained"
                  fullWidth
                  type="submit"
                >
                  Iniciar sessió
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}

export default Login
