import React, { useEffect, useMemo } from 'react'
import { GroupAdd, Link, Share } from '@mui/icons-material'
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material'
import { Helmet } from 'react-helmet-async'
import { useLocation, useParams } from 'react-router-dom'
import { useHeader } from '../HeaderProvider'
import LoadingScreen from '../LoadingScreen'
import { useFamilies } from './FamilyProvider'
import useClient from '../useClient'
import { useState } from 'react'
import { RWebShare } from 'react-web-share'
import PropTypes from 'prop-types'
import { useAuth } from '../auth/AuthProvider'
import { useSnackbar } from 'notistack'

const FamilySettings = ({ invitationToken }) => {
  const params = useParams()
  const location = useLocation()
  const { families, refreshFamilies } = useFamilies()
  const { setHeader } = useHeader()
  const { invitationsRequest, joinFamilyRequest } = useClient()
  const [invitationLink, setInvitationLink] = useState()
  const { user } = useAuth()
  const [family, setFamily] = useState()
  const { enqueueSnackbar } = useSnackbar()

  const isFamilyMember = useMemo(() => {
    if (!family) {
      return false
    }

    return family.members.find(member => member.id === user.userId)
  }, [family, user.userId])

  useEffect(() => {
    if (families) {
      const family = families.find(
        family => family.id === Number(params.familyId)
      )
      if (family) {
        setFamily(family)
      }
    }

    if (invitationToken) {
      fetch(
        `${process.env.REACT_APP_API_URL}/invitations/${invitationToken}`
      ).then(res => {
        if (res.status !== 200) {
          console.log('Error getting invitation information', res.status)
          return
        }
        res.json().then(data => setFamily(data.family))
      })
    }
  }, [families, params.familyId, user.userId, invitationToken])

  useEffect(() => {
    if (family) {
      setHeader('Família ' + family.name)
    }
  }, [setHeader, family])

  if (!family) {
    return <LoadingScreen />
  }

  const createInvitation = () => {
    invitationsRequest({
      method: 'POST',
      body: JSON.stringify({ family_id: family.id }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
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

  const joinFamily = () => {
    joinFamilyRequest(family.id, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.userId, token: invitationToken }),
      headers: { 'Content-Type': 'application/json' },
    }).then(res => {
      if (res.status !== 200) {
        console.log('Error joining family', res)
        res.json().then(error => {
          if (error.code === 1) {
            enqueueSnackbar('No et pots unir a més famílies', {
              variant: 'error',
              preventDuplicate: true,
            })
          }
        })
      } else {
        refreshFamilies()
      }
    })
  }

  return (
    <>
      <Helmet>
        <title>Família {family.name}</title>
      </Helmet>

      <Container sx={{ mt: 2 }}>
        <Typography variant="h6" component="h2">
          Membres
        </Typography>
      </Container>

      <List>
        <Divider />
        {family.members.map(member => (
          <ListItem key={member.id}>
            <ListItemIcon>
              <Avatar />
            </ListItemIcon>
            <ListItemText>
              {member.first_name} {member.last_name}
            </ListItemText>
          </ListItem>
        ))}
        <Divider />
      </List>

      <Container sx={{ mt: 2 }}>
        {isFamilyMember ? (
          <>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Afegir Membres
            </Typography>

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
          </>
        ) : (
          <Stack alignItems="center" sx={{ mt: 4 }}>
            <Card>
              <CardContent>
                T&apos;han convidat a unir-te a {family.name}
              </CardContent>

              <CardActions sx={{ justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<GroupAdd />}
                  onClick={joinFamily}
                >
                  Entrar a aquesta família
                </Button>
              </CardActions>
            </Card>
          </Stack>
        )}
      </Container>
    </>
  )
}

FamilySettings.propTypes = {
  invitationToken: PropTypes.string,
}

export default FamilySettings
