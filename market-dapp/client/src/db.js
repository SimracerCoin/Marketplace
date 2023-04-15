// Import path module
const path = require('path')

// Get the location of database.sqlite file
const dbPath = path.resolve(__dirname, 'db', 'database.sqlite')

// Create connection to SQLite database
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true
})

// Create a table in the database called "metatags"
knex.schema
  // Make sure no "metatags" table exists
  // before trying to create new
  .hasTable('metatags')
  .then((exists) => {
    if (!exists) {
      // If no "metatags" table exists
      // create new
      return knex.schema.createTable('metatags', (table)  => {
        table.primary(['id', 'category'])
        table.integer('id').unsigned()
        table.string('description')
        table.string('image')
        table.string('category')
      })
      .then(() => {
        // Log success message
        console.log('Table \'metatags\' created')
      })
      .catch((error) => {
        console.error(`There was an error creating table: ${error}`)
      })
    }
  })
  .then(() => {
    // Log success message
    console.log('done')
  })
  .catch((error) => {
    console.error(`There was an error setting up the database: ${error}`)
  })

// Export the database
module.exports = knex