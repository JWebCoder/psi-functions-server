/**
 * Module dependencies.
 */

import '@root/envLoader'
import Debug from 'debug'
import Psi from '@root/psi'

const debug = Debug('psi:function server')

debug('Creating socket')
new Psi(parseInt(process.env.TCP_SERVER_PORT || '1337', 10), 'localhost')
debug('Finished creating socket')

