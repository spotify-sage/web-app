const { Route } = require('../')
const { Router } = require('express')
const { URLSearchParams } = require('url')

const fetch = require('node-fetch')

const BASE_URL = 'https://api.spotify.com/v1'

module.exports = class SessionRoute extends Route {
  constructor (client) {
    super(client)
    this.name = 'session'
  }

  register (app) {
    const router = Router()

    router.get('/', async (req, res) => {
      if (!req.query.access_token || !req.query.refresh_token) return res.status(400).json({ authenticated: false })
      else {
        var state = {
          loggedIn: false,
          accessToken: '',
          refreshToken: ''
        }

        const payload = await fetch(`${BASE_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${req.query.access_token}`
          }
        }).then(res => res.json())
          .then(async json => {
            if (json.error) {
              if (json.error.message === 'The access token expired') {
                const url = new URL(`https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=${req.query.refresh_token}`)
                const params = new URLSearchParams(url.search.slice(1))

                await fetch(`https://accounts.spotify.com/api/token`, {
                  method: 'POST',
                  body: params,
                  headers: {
                    'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
                  }
                }).then(res => res.json())
                  .then(json => {
                    if (json.error) return state = {
                      loggedIn: false
                    }
                    else return state = {
                      loggedIn: true,
                      accessToken: json.access_token,
                      refreshToken: req.query.refresh_token
                    }
                  })
              } else return state = {
                loggedIn: false
              }
            } else return state = { 
              loggedIn: true, 
              accessToken: req.query.access_token, 
              refreshToken: req.query.refresh_token
            }
          })
          .catch(error => console.log(error))

        if (!state.loggedIn) return res.status(401).json({ authenticated: false })
        else {
          const { accessToken, refreshToken } = state
          fetch(`${BASE_URL}/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }).then(res => res.json())
            .then(json => {
              return res.status(200).json({ authenticated: true, accessToken, refreshToken, displayName: json.display_name, imageUrl: json.images[0] ? json.images[0].url : null })
            })
        }
      }
    })

    app.use(this.path, router)
  }
}