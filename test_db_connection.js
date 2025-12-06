require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful:', res.rows[0]);

    console.log('Testing job insertion...');
    const jobType = 'test_job';
    const inputData = { message: 'test' };
    
    const insertRes = await pool.query(
      `INSERT INTO jobs (job_type, status, input_data)
       VALUES ($1, 'pending', $2)
       RETURNING id`,
      [jobType, JSON.stringify(inputData)]
    );
    console.log('Job insertion successful, ID:', insertRes.rows[0].id);

    // Clean up
    await pool.query('DELETE FROM jobs WHERE id = $1', [insertRes.rows[0].id]);
    console.log('Test job cleaned up');

  } catch (err) {
    console.error('Database error:', err);
  } finally {
    await pool.end();
  }
}

testConnection();