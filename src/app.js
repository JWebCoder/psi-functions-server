import express from 'express'
import path from 'path'
// import favicon from 'serve-favicon'
import logger from 'morgan'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import Debug from 'debug'

// routes
import index from 'routes'

const debug = Debug('raspsi:setup')

/** Class representing the express server instance. */
class App {
  /**
  * Create an express server instance.
  */
  constructor () {
    debug('start')
    this.server = express()

    // view engine setup
    this.server.set('views', path.join(__dirname, 'views'))
    this.server.set('view engine', 'jade')

    // uncomment after placing your favicon in /public
    // app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    this.server.use(logger('dev'))
    this.server.use(bodyParser.json())
    this.server.use(bodyParser.urlencoded({ extended: false }))
    this.server.use(cookieParser())
    this.server.use(express.static(path.join(__dirname, '../public')))

    this.server.use('/', index())

    // catch 404 and forward to error handler
    this.server.use(
      (req, res, next) => {
        const err = new Error('Not Found')
        err.status = 404
        next(err)
      }
    )

    // error handler
    this.server.use(
      (err, req, res, next) => {
        res.status(err.status || 500)

        res.json({
          message: err.message,
        })
      }
    )
    debug('end')
  }
}

export default App
