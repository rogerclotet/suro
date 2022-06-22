import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import * as yup from 'yup'
import { useFormik } from 'formik'
import { LoadingButton } from '@mui/lab'
import { Save } from '@mui/icons-material'
import { useState } from 'react'

const validationSchema = yup.object({
  name: yup.string('Nom de la família').required('El nom és obligatori'),
})

const EditFamilyDialog = ({ title, initialValues, open, onSave, onClose }) => {
  const [isSaving, setIsSaving] = useState(false)
  const formik = useFormik({
    initialValues: initialValues || {
      name: '',
    },
    validationSchema: validationSchema,
    onSubmit: data => {
      setIsSaving(true)

      onSave(data).then(() => {
        formik.resetForm()
        setIsSaving(false)
        onClose()
      })
    },
  })

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack direction="column" gap={2} pt={2}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              name="name"
              label="Nom"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>
            Canceŀlar
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSaving}
            loadingPosition="start"
            startIcon={<Save />}
            disabled={!formik.dirty || !formik.isValid || isSaving}
          >
            Desar
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  )
}

EditFamilyDialog.propTypes = {
  title: PropTypes.string.isRequired,
  initialValues: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default EditFamilyDialog
