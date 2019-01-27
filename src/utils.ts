import fs from 'fs'
import path from 'path'
import { socketMessage } from '@root/psi'

export function messageParser (data: string | Buffer): socketMessage | null {
  try {
    return JSON.parse(data.toString())
  } catch (error) {
    return null
  }
}

export function listFunctions (): Array<string> {
  const functionsPath = path.resolve(__dirname, '../functions')
  return fs.readdirSync(functionsPath).filter(function (file) {
    return fs.statSync(functionsPath + '/' + file).isDirectory()
  })
}
