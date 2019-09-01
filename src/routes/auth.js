const { Route } = require('../')
const { Router } = require('express')
const { URLSearchParams } = require('url')

const fetch = require('node-fetch')
const crypto = require('crypto')

module.exports = class AuthRoute extends Route {
  constructor (client) {
  	super(client)
  	this.name = 'auth'
  }

  register (app) {
  	const router = Router()

  	router.get('/', (req, res) => {
  	  const scopes = 'user-read-recently-played playlist-modify-private playlist-read-private user-top-read'
  	  res.redirect('https://accounts.spotify.com/authorize' +
  	  	'?response_type=code' +
  	  	`&client_id=${process.env.SPOTIFY_CLIENT_ID}` +
  	  	`&scope=${encodeURIComponent(scopes)}` +
        `&state=${crypto.randomBytes(16).toString('hex')}` +
        `&show_dialog=true` +
  	  	`&redirect_uri=${encodeURIComponent(`${process.env.URL}auth/callback`)}`)
  	})

  	router.get('/callback', (req, res) => {
      if (req.query.error) res.status(500).json({ ok: false, error: req.query.error })

      if (req.query.code) {
        const params = new URLSearchParams()

        params.append('grant_type', 'authorization_code')
        params.append('code', req.query.code)
        params.append('redirect_uri', `${process.env.URL}auth/callback`)

        fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          body: params,
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
          }
        }).then(res => res.json())
          .then(json => {
            if (json.error) return res.status(500).json(json)
            else if (json.access_token) {
              res.redirect(process.env.URL +
                `?access_token=${json.access_token}` +
                `&refresh_token=${json.refresh_token}` +
                `&state=${req.query.state}`)
            }
          })
          .catch(error => console.error(error))
      }
  	})

  	app.use(this.path, router)
  }
}