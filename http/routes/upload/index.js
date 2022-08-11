import app from 'wampark'
import bodyParser from 'koa-body'
import mime from 'mime-types'
import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import WebRoute from '../../../lib/WebRoute.js'

const ROUTES_UPLOAD_DIR = process.env.ROUTES_UPLOAD_DIR || './.uploaded_routes'

export default class WebRouteUpload extends WebRoute {
  constructor () {
    super({
      type: app.RouteTypes.POST,
      uri: '/api/routes/upload',
      middleware: [
        bodyParser({
           uploadDir: './uploads',
           multipart: true,
           urlencoded: true
        })
      ]
    })
  }

  async endpoint (ctx, next) {
    try {
      shell.mkdir('-p', ROUTES_UPLOAD_DIR)

      const {filepath, name, type, originalFilename} = ctx.request.files.file
      const fileExtension = mime.extension(originalFilename)
      console.log(`filepath: ${filepath}`)
      console.log(`originalFilename: ${originalFilename}`)
      console.log(`type: ${type}`)
      console.log(`fileExtension: ${fileExtension}`)


      const uploadedFilePath = path.join('./', ROUTES_UPLOAD_DIR, originalFilename)

      shell.rm('-rf', uploadedFilePath)

      try {
        fs.createReadStream(filepath).pipe(fs.createWriteStream(uploadedFilePath))
        console.log(`Uploaded file successfully ${uploadedFilePath}`)

        ctx.body = {
          status: 1,
          filepath: uploadedFilePath,
          originalFilename
        }

        next()
        
      } catch (error) {
        console.error('Uploading file failed: ' + error.message, error)
      }
    } catch (error) {
      console.error(error)
      throw error
      // res.status(500).send(error)
    }
  }
}
