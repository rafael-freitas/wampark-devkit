import mongoose from 'mongoose'
import { createBucket } from 'mongoose-gridfs'

export let Attachment = {}

mongoose.connection.on('open', openHandlerCalbackGridFs)

function openHandlerCalbackGridFs () {
  Attachment = createBucket({
    bucketName: 'files',
    connection: mongoose.connection
  })
}