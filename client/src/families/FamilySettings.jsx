import { GroupAdd, Link, Share } from '@mui/icons-material'
import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  OutlinedInput,
  Stack,
} from '@mui/material'
import React, { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation, useParams } from 'react-router-dom'
import { useHeader } from '../HeaderProvider'
import LoadingScreen from '../LoadingScreen'
import { useFamilies } from './FamilyProvider'
import useClient from '../useClient'
import { useState } from 'react'
import { RWebShare } from 'react-web-share'

const FamilySettings = () => {
  const params = useParams()
  const location = useLocation()
  const { families } = useFamilies()
  const { setHeader } = useHeader()
  const { invitationRequest } = useClient()
  const [invitationLink, setInvitationLink] = useState()

  const family = useMemo(
    () => families.find(family => family.id === Number(params.familyId)),
    [families, params.familyId]
  )

  useEffect(() => {
    if (family) {
      setHeader('Família ' + family.name)
    }
  }, [setHeader, family])

  if (!family) {
    return <LoadingScreen />
  }

  const createInvitation = () => {
    invitationRequest({ method: 'POST' }).then(res => {
      if (res.status !== 200) {
        console.log('Error creating invitation', res.status)
      }
      res
        .json()
        .then(data =>
          setInvitationLink(
            `${window.location.host}${location.pathname}?t=${data.token}`
          )
        )
    })
  }

  return (
    <>
      <Helmet>
        <title>Família {family.name}</title>
      </Helmet>

      <List>
        <ListSubheader>Membres</ListSubheader>
        <ListItem>
          {family.members.map(member => (
            <ListItemText key={member.id}>
              {member.first_name} {member.last_name}
            </ListItemText>
          ))}
        </ListItem>
        <ListSubheader>Afegir Membres</ListSubheader>
        <ListItem>
          {invitationLink ? (
            <Stack
              direction="row"
              alignItems="center"
              gap={2}
              sx={{ width: '100%' }}
            >
              <FormControl fullWidth>
                <InputLabel htmlFor="invitationLink">
                  Enllaç d&apos;invitació
                </InputLabel>
                <OutlinedInput
                  id="invitationLink"
                  startAdornment={
                    <InputAdornment position="start">
                      <Link />
                    </InputAdornment>
                  }
                  value={invitationLink}
                  label="Enllaç d'invitació"
                />
              </FormControl>
              <div>
                <RWebShare
                  data={{
                    title: 'Família',
                    text: `Uneix-te a la família ${family.name}!`,
                    url: invitationLink,
                  }}
                >
                  <IconButton>
                    <Share />
                  </IconButton>
                </RWebShare>
              </div>
            </Stack>
          ) : (
            <Button startIcon={<GroupAdd />} onClick={createInvitation}>
              Convidar un nou membre
            </Button>
          )}
        </ListItem>
      </List>
    </>
  )
}

export default FamilySettings
