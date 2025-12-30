module.exports = async function globalTeardown() {
  // Stop the in-memory MongoDB instance
  if (global.__MONGOINSTANCE__) {
    await global.__MONGOINSTANCE__.stop()
    console.log('\n✅ MongoDB Memory Server stopped')
  }
}
