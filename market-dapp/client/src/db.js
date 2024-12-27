// Import path module
const path = require('path');

// Get the location of database.sqlite file
const dbPath = path.resolve(__dirname, 'db', 'database.sqlite');

// Create connection to SQLite database
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

// Function to create the "metatags" table
const createMetatagsTable = async () => {
  const exists = await knex.schema.hasTable('metatags');
  if (!exists) {
    await knex.schema
      .createTable('metatags', (table) => {
        table.integer('id').unsigned();
        table.string('description');
        table.string('image');
        table.string('category');
        table.primary(['id', 'category']);
      })
      .then(() => {
        console.log('Table \'metatags\' created');
      })
      .catch((error) => {
        console.error(`There was an error creating table 'metatags': ${error}`);
      });
  }
};

// Function to create the "drops" table
const createDropsTable = async () => {
  const exists = await knex.schema.hasTable('drops');
  if (!exists) {
    await knex.schema
      .createTable('drops', (table) => {
        table.integer('drop').unsigned();
        table.integer('pack').unsigned();
        table.integer('moment').unsigned();
        table.string('metadata').notNullable();
        table.primary(['drop', 'moment']);
      })
      .then(() => {
        console.log('Table \'drops\' created');
      })
      .catch((error) => {
        console.error(`There was an error creating table 'drops': ${error}`);
      });
  }
};

// Initialize the database
const initializeDatabase = async () => {
  try {
    await createMetatagsTable();
    await createDropsTable();
    console.log('done');
  } catch (error) {
    console.error(`There was an error setting up the database: ${error}`);
  }
};

// Run the initialization
initializeDatabase();

// Export the database
module.exports = knex;