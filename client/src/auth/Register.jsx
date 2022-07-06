import React, { useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  Container,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { useAuth } from './AuthProvider'
import { useLayout } from 'HeaderProvider'
import { Link as RouterLink } from 'react-router-dom'
import { useSnackbar } from 'notistack'

const validationSchema = yup.object({
  email: yup
    .string('Introdueix un email')
    .email('Introdueix un email vàlid')
    .required("L'email és obligatori"),
  first_name: yup.string('Introdueix un nom').required('El nom és obligatori'),
  last_name: yup.string('Introdueix els cognoms'),
  password: yup
    .string('Introdueix la contrasenya')
    .min(8, 'La contrasenya ha de tenir 8 caràcters com a mínim')
    // TODO Add validations to match backend
    .required('La contrasenya és obligatòria'),
})

const Register = () => {
  const { register, logIn } = useAuth()
  const { setHeader } = useLayout()
  const { enqueueSnackbar } = useSnackbar()

  const formik = useFormik({
    initialValues: {
      email: '',
      first_name: '',
      last_name: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: ({
      email,
      first_name: firstName,
      last_name: lastName,
      password,
    }) => {
      register(email, firstName, lastName, password).then(res => {
        if (res.status === 200) {
          logIn(email, password)
        } else {
          enqueueSnackbar(
            'Hi ha hagut un problema durant el registre. Sisplau, torna-ho a provar més tard.',
            { variant: 'error' }
          )
          console.log('Error signing up', res)
        }
      })
    },
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
              Registre
            </Typography>
            <form onSubmit={formik.handleSubmit}>
              <Stack direction="column" gap={2}>
                <TextField
                  fullWidth
                  type="email"
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
                  id="first_name"
                  name="first_name"
                  label="Nom"
                  value={formik.values.first_name}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.first_name &&
                    Boolean(formik.errors.first_name)
                  }
                  helperText={
                    formik.touched.first_name && formik.errors.first_name
                  }
                />
                <TextField
                  fullWidth
                  id="last_name"
                  name="last_name"
                  label="Cognoms"
                  value={formik.values.last_name}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.last_name && Boolean(formik.errors.last_name)
                  }
                  helperText={
                    formik.touched.last_name && formik.errors.last_name
                  }
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
                  Registra&apos;t
                </Button>

                <Typography>
                  Ja tens un compte?{' '}
                  <Link component={RouterLink} to="/login">
                    Inicia sessió
                  </Link>
                </Typography>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  )
}

export default Register
