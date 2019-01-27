import { messageParser, listFunctions } from '@root/utils'
import net from 'net'
import path from 'path'
import Debug from 'debug'

const debug = Debug('psi:socket class')

export interface socketMessage {
  type: string;
  function?: {
    name: string
  },
  callbackID?: string,
  data?: {
    body?: {},
    query?: {}
  }
}

interface loadedFunction {
  function: (
    body: {} | undefined,
    query: {} | undefined,
    next: (data: any) => void
  ) => void,
  timestamp: number
}

export default class Client extends net.Socket{
  private TTL: number = 60 * 1000
  INTERVAL: NodeJS.Timeout | undefined
  loadedFunctions: {
    [key: string]: loadedFunction
  } = {}
  functionNames: Array<string> = []

  constructor(port: number, host: string, options?: net.SocketConstructorOpts) {
    super(options)

    this.setEvents()
    this.createCleaningInterval()

    this.connect(
      port,
      host,
      () => {
        debug('PSI: PSI Client connected')
        this.write(JSON.stringify(
          {
            type: 'functionList',
            items: listFunctions(),
          }
        ))
      }
    )
  }

  createCleaningInterval() {
    this.INTERVAL = setInterval(
      () => {
        const currentTime = new Date().getTime()
        this.functionNames = this.functionNames.filter(
          (functionName) => {
            const valid = currentTime - this.loadedFunctions[functionName].timestamp >= this.TTL
            if (!valid) {
              delete this.loadedFunctions[functionName]
            }
            return valid
          }
        )
      },
      this.TTL
    )
  }

  run(loadedFunction: loadedFunction, callbackID?: string, body?: {}, query?: {}) {
    loadedFunction.function(body, query, (result) => {
      this.write(JSON.stringify({
        data: result,
        callbackID,
        type: 'functionAnswer',
      }))
    })
  }

  async loadModule(functionName: string): Promise<loadedFunction> {
    return await import(path.resolve(__dirname, '../functions', functionName, 'index.js')).then(
      module => {
        this.loadedFunctions[functionName] = {
          function: module.default,
          timestamp: new Date().getTime(),
        }
        this.functionNames = Object.keys(this.loadedFunctions)
        debug(`loaded ${functionName}`)
        return this.loadedFunctions[functionName]
      }
    ).catch(
      err => {
        throw err
      }
    )
  }

  setEvents() {
    this.on('data', (data: Buffer) => {
      const message = messageParser(data)
      if (!message) {
        return
      }
      debug('PSI Received: ' + data.toString())
      switch (message.type) {
        case 'runFunction':
          if (message.function) {
            const functionName = message.function.name
            message.data = message.data || {}
            if (this.loadedFunctions[functionName]) {
              this.run(
                this.loadedFunctions[functionName],
                message.callbackID,
                message.data.body,
                message.data.query
              )
            } else {
              this.loadModule(functionName).then(
                (functionItem) => {
                  this.run(functionItem, message.callbackID)
                }
              ).catch(
                err => console.log(err)
              )
            }
          }
          break
      }
    })

    this.on('close', () => {
      if (this.INTERVAL) {
        clearInterval(this.INTERVAL)
      }
      debug('Client: Connection closed')
    })
  }
}
