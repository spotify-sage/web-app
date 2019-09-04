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
  	  res.redirect(process.env.FRONTEND_URL)
  	})

  	app.use(this.path, router)
  }
}