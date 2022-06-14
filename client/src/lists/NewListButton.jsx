import { Add, Save } from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Stack,
  TextField,
} from '@mui/material'
import LoadingButton from '@mui/lab/LoadingButton'
import React, { useState } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { useAuth } from '../auth/AuthProvider'
import PropTypes from 'prop-types'

const validationSchema = yup.object({
  name: yup.string('Nom de la llista').required('El nom és obligatori'),
  description: yup.string('Descripció'),
})

const NewListButton = ({ onClose }) => {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { token } = useAuth()

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
    },
    validationSchema: validationSchema,
    onSubmit: data => {
      setIsCreating(true)
      fetch(`${process.env.REACT_APP_API_URL}/families/1/lists/`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
        .then(() => {
          setOpen(false)
          setIsCreating(false)
          onClose()
        })
        .finally(() => {
          formik.resetForm()
        })
    },
  })

  const handleOpen = () => {
    setOpen(true)
    onClose()
  }

  const handleCancel = () => {
    if (!isCreating) {
      setOpen(false)
      onClose()
    }
  }

  return (
    <>
      <Fab
        onClick={handleOpen}
        color="primary"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
      >
        <Add />
      </Fab>

      <Dialog open={open} onClose={handleCancel}>
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>Llista nova</DialogTitle>
          <DialogContent>
            <Stack direction="column" gap={2} pt={2}>
              <TextField
                fullWidth
                id="name"
                name="name"
                label="Nom"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                id="description"
                name="description"
                label="Descripció"
                value={formik.values.description}
                onChange={formik.handleChange}
                error={
                  formik.touched.description &&
                  Boolean(formik.errors.description)
                }
                helperText={
                  formik.touched.description && formik.errors.description
                }
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleCancel} disabled={isCreating}>
              Canceŀlar
            </Button>
            <LoadingButton
              type="submit"
              loading={isCreating}
              loadingPosition="start"
              startIcon={<Save />}
            >
              Crear
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}

NewListButton.propTypes = {
  onClose: PropTypes.func.isRequired,
}

export default NewListButton
