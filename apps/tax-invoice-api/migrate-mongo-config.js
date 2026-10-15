require('dotenv').config()

const config = {
  mongodb: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    options: {
      connectTimeoutMS: 3600000,
      socketTimeoutMS: 3600000,
    },
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
}

module.exports = config
