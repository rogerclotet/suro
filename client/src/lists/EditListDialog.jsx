import { Save } from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import LoadingButton from '@mui/lab/LoadingButton'
import React, { useState } from 'react'
import * as yup from 'yup'
import { useFormik } from 'formik'
import PropTypes from 'prop-types'

const validationSchema = yup.object({
  name: yup.string('Nom de la llista').required('El nom és obligatori'),
  description: yup.string('Descripció'),
})

const EditListDialog = ({
  initialValues = { name: '', description: '', is_template: false },
  open,
  onSave,
  onCancel,
}) => {
  const [isCreating, setIsCreating] = useState(false)

  const formik = useFormik({
    initialValues,
    validationSchema: validationSchema,
    onSubmit: data => {
      setIsCreating(true)
      onSave(data).then(() => {
        setIsCreating(false)
        formik.resetForm()
      })
    },
  })

  const handleCancel = () => {
    if (!isCreating) {
      onCancel()
    }
  }

  return (
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
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={
                formik.touched.description && formik.errors.description
              }
            />
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    id="is_template"
                    name="is_template"
                    value={formik.values.is_template}
                    onChange={formik.handleChange}
                  />
                }
                label="Plantilla"
              />
            </FormGroup>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleCancel} disabled={isCreating}>
            Canceŀlar
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isCreating}
            loadingPosition="start"
            startIcon={<Save />}
            disabled={!formik.dirty || !formik.isValid || isCreating}
          >
            Crear
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  )
}

EditListDialog.propTypes = {
  initialValues: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}

export default EditListDialog
