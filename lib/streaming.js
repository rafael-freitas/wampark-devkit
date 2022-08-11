import { Readable } from 'stream'

export function createReadStreamFromBuffer (buffer) {
  const readstream = new Readable()
  // for (let buffer of data) {
  //   readstream.push(buffer)
  // }
  readstream.push(buffer)
  readstream.push(null)
  return readstream
}

/**
 * Converte um stream de GridReadStream para uma instancia de Buffer()
 * @param read_stream GridReadStream
 * @returns Buffer
 */
export function getBufferFromStream (read_stream) {
  return new Promise((resolve, reject) => {
    const file = []
    read_stream.on('data', function (chunk) {
      file.push(chunk)
    })
    read_stream.on('error', e => {
      reject(e)
    })
    read_stream.on('end', function () {
      // concatenar o array de chunks do arquivo em uma instancia de Buffer
      resolve(Buffer.concat(file))
    })
  })
}
