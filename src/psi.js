import 'envLoader'
import { messageParser, listFunctions } from './utils'
import net from 'net'
const loadedFunctions = {}
let functionNames = []
const TTL = 60 * 1000

const INTERVAL = setInterval(
  function () {
    const currentTime = new Date().getTime()
    functionNames = functionNames.filter(
      function (functionName) {
        const valid = currentTime - loadedFunctions[functionName].timespan >= TTL
        if (!valid) {
          delete loadedFunctions[functionName]
        }
        return valid
      }
    )
  },
  TTL
)

function run (loadedFunction, callbackID) {
  client.write(JSON.stringify({
    data: loadedFunction.function(),
    callbackID,
    type: 'functionAnswer',
  }))
}

let client = net.createConnection({
  port: process.env.TCP_SERVER_PORT || 1337,
  host: 'localhost',
}, function () {
  console.log('PSI: PSI Client connected')
  client.write(JSON.stringify(
    {
      type: 'functionList',
      items: listFunctions(),
    }
  ))
})

client.on('data', function (data) {
  const message = messageParser(data)
  if (!message) {
    return
  }
  console.log('PSI Received: ' + data.toString())
  switch (message.type) {
    case 'runFunction':
      const functionName = message.function.name
      if (loadedFunctions[functionName]) {
        run(loadedFunctions[functionName], message.callbackID || null)
      } else {
        import('/Users/joaomoura/Repos/personal/ras-psi/functions/' + functionName + '/index.js').then(
          module => {
            loadedFunctions[functionName] = {
              function: module.default,
              timespan: new Date().getTime(),
            }
            functionNames = Object.keys(loadedFunctions)
            console.log('loaded', functionName)
            run(loadedFunctions[functionName], message.callbackID || null)
          }
        ).catch(
          err => console.log(err)
        )
      }
      break
  }
})

client.on('close', function () {
  clearInterval(INTERVAL)
  console.log('Client: Connection closed')
})
