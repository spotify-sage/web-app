const { Route } = require('../')
const { Router } = require('express')

const fetch = require('node-fetch')
const moment = require('moment')

const BASE_URL = 'https://api.spotify.com/v1'


module.exports = class UserRoute extends Route {
  constructor (client) {
  	super(client)
  	this.name = 'user'
  }

  register (app) {
  	const router = Router()

  	router.get('/get-account-information', (req, res) => {
  	  if (!req.query.access_token) return res.status(401).json({ ok: false, error: 'Unauthorized' })
  	  else {
  	  	fetch(`${BASE_URL}/me`, {
  	  		headers: {
  	  			'Authorization': `Bearer ${req.query.access_token}`
  	  		}
  	  	}).then(res => res.json())
          .then(json => res.status(200).json(json))
          .catch(error => res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.toString() }))
  	  }
  	})

    router.get('/get-account-recent-plays', (req, res) => {
      if (!req.query.access_token) return res.status(401).json({ ok: false, error: 'Unauthorized' })
      else {
        fetch(`${BASE_URL}/me/player/recently-played`, {
          headers: {
            'Authorization': `Bearer ${req.query.access_token}`
          }
        }).then(res => res.json())
          .then(json => res.status(200).json(json))
          .catch(error => res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.toString() }))
      }
    })

    router.get('/get-recommended-tracks', (req, res) => {
      if (!req.query.access_token) return res.status(401).json({ ok: false, error: 'Unauthorized' })
      else {
        fetch(`${BASE_URL}/me/top/tracks`, {
          headers: {
            'Authorization': `Bearer ${req.query.access_token}`
          }
        }).then(res => res.json())
          .then(json => res.status(200).json(json))
          .catch(error => res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.toString() }))
      }
    })

    router.get('/create-recommended-playlist', (req, res) => {
      if (!req.query.access_token) return res.status(401).json({ ok: false, error: 'Unauthorized' })
      else {
        fetch(`${BASE_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${req.query.access_token}`
          }
        }).then(res => res.json())
          .then(userPayload => {
            if (userPayload.error) return res.status(500).json({ ok: false, error: userPayload.error.status, message: userPayload.error.message })
            fetch(`${BASE_URL}/users/${userPayload.id}/playlists`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${req.query.access_token}`
              },
              body: JSON.stringify({
                name: `Spotify Guru Playlist`,
                public: false,
                description: `Playlist generated with Spotify Guru's Recommended Playlist functionality on ${moment(Date.now()).format('DD/MM/YYYY [at] hh:mm A')} (${Date.now()})`
              })
            }).then(res => res.json())
              .then(playlistPayload => {
                if (playlistPayload.error) return res.status(500).json({ ok: false, error: playlistPayload.error.status, message: playlistPayload.error.message })
                fetch(`${BASE_URL}/me/top/tracks?limit=${req.query.limit}`, {
                  headers: {
                    'Authorization': `Bearer ${req.query.access_token}`
                  }
                }).then(res => res.json())
                  .then(topTracksPayload => {
                    if (topTracksPayload.error) return res.status(500).json({ ok: false, error: topTracksPayload.error.status, message: topTracksPayload.error.message })
                    fetch(`${BASE_URL}/playlists/${playlistPayload.id}/tracks`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${req.query.access_token}`
                      },
                      body: JSON.stringify({
                        uris: topTracksPayload.items.map(i => i.uri)
                      })
                    }).then(res => res.json())
                      .then(json => {
                        if (json.error) return res.status(500).json({ ok: false, error: json.error.status, message: json.error.message })
                        res.status(200).json({ ok: true, message: playlistPayload.external_urls.spotify })
                      })
                      .catch(error => res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.toString() }))
                  })
                  .catch(error => res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.toString() }))
              })
              .catch(error => res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.toString() }))
          })
          .catch(error => res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.toString() }))
      }
    })

  	app.use(this.path, router)
  }
}