const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'admin',
  password: 'admin',
  database: 'xprespay_db',
});

client.connect()
  .then(() => {
    console.log('✅ CONNECTED TO POSTGRESQL!');
    return client.query('SELECT NOW()');
  })
  .then(result => {
    console.log('✅ Current time:', result.rows[0].now);
    return client.end();
  })
  .then(() => {
    console.log('✅ ALL TESTS PASSED!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ FAILED:', err.message);
    process.exit(1);
  });