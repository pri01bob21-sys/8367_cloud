const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'switch_db',
  password: 'your_password',
  port: 5432,
});

module.exports = pool;