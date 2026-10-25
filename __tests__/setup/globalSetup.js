const { MongoMemoryServer } = require('mongodb-memory-server')

module.exports = async function globalSetup() {
  // mongod's data dir lives in os.tmpdir(); on disk (esp. WSL) fsync latency times out hooks
  if (require('fs').existsSync('/dev/shm')) process.env.TMPDIR = '/dev/shm'

  // Create an in-memory MongoDB instance
  const instance = await MongoMemoryServer.create({
    binary: {
      version: '7.0.0',
    },
  })

  const uri = instance.getUri()
  global.__MONGOINSTANCE__ = instance
  process.env.MONGODB_URI = uri.slice(0, uri.lastIndexOf('/'))

  // Store the instance for global teardown
  global.__MONGO_URI__ = uri

  console.log('\n🚀 MongoDB Memory Server started at:', uri)
}
