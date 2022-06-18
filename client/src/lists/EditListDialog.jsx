import React, { useMemo, useState } from 'react'
import { Info, Save } from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material'
import LoadingButton from '@mui/lab/LoadingButton'
import * as yup from 'yup'
import { useFormik } from 'formik'
import PropTypes from 'prop-types'
import { useLists } from './ListsProvider'

const validationSchema = yup.object({
  name: yup.string('Nom de la llista').required('El nom és obligatori'),
  description: yup.string('Descripció'),
})

const EditListDialog = ({ title, initialValues, open, onSave, onCancel }) => {
  const [isCreating, setIsCreating] = useState(false)
  const { lists } = useLists()

  const templates = useMemo(
    () => lists.filter(list => list.is_template),
    [lists]
  )

  const formik = useFormik({
    initialValues: initialValues || {
      name: '',
      description: '',
      is_template: false,
      imported_templates: [],
    },
    validationSchema: validationSchema,
    onSubmit: data => {
      setIsCreating(true)

      if (data.is_template) {
        // Ignore the field imported templates when creating templates
        data.imported_templates = []
      }

      const { imported_templates: importedTemplateIds, ...listData } = data
      listData.items = listData.items || []
      importedTemplateIds.forEach(templateId =>
        templates
          .find(template => template.id === templateId)
          .items.forEach(item => {
            // eslint-disable-next-line no-unused-vars
            const { id, ...itemData } = item
            listData.items.push(itemData)
          })
      )

      onSave(listData).then(() => {
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
        <DialogTitle>{title}</DialogTitle>
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
            <FormGroup
              sx={{
                pl: 2,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    id="is_template"
                    name="is_template"
                    value={formik.values.is_template}
                    onChange={formik.handleChange}
                  />
                }
                label="És una plantilla"
              />
              <Tooltip title="Es crearà una llista amb elements que es poden importar al crear noves llistes.">
                <Info />
              </Tooltip>
            </FormGroup>
            {!formik.values.is_template && (
              <FormControl>
                <InputLabel>Plantilles a importar</InputLabel>
                <Select
                  multiple
                  id="imported_templates"
                  name="imported_templates"
                  input={<OutlinedInput label="Plantilles" />}
                  value={formik.values.imported_templates}
                  onChange={formik.handleChange}
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip
                          key={value}
                          label={
                            templates.find(template => template.id === value)
                              .name
                          }
                        />
                      ))}
                    </Box>
                  )}
                >
                  {templates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name} ({template.items.length} elements)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
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
  title: PropTypes.string.isRequired,
  initialValues: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}

export default EditListDialog
