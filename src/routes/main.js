const { Route } = require('../')
const { Router } = require('express')

module.exports = class MainRoute extends Route {
  constructor (client) {
  	super(client)
  	this.name = ''
  }

  register (app) {
  	const router = Router()

  	router.get('/', (req, res) => {
  	  res.status(200).json({ ok: true, message: 'OK' })
  	})

  	app.use(this.path, router)
  }
}