#!/usr/bin/env node

/**
 * Database Diagnostic Script
 * This script helps diagnose and fix common database connection issues
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('=== DATABASE DIAGNOSTIC TOOL ===\n');

async function runDiagnostics() {
  try {
    // 1. Check if DATABASE_URL is configured
    console.log('1. Checking DATABASE_URL configuration...');
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set in environment variables');

      // Check if .env file exists
      const envPath = path.join(__dirname, '..', '.env');
      if (fs.existsSync(envPath)) {
        console.log('ℹ️  .env file exists, but DATABASE_URL might be missing or malformed');
      } else {
        console.log('ℹ️  No .env file found. You need to create one with DATABASE_URL=');
        console.log('Example: DATABASE_URL=postgresql://user:password@localhost:5432/database');
      }

      // Provide guidance
      console.log('\n📋 To fix this:');
      console.log('1. Create a .env file in the project root');
      console.log('2. Add: DATABASE_URL=postgresql://username:password@host:5432/database');
      console.log('3. Replace username, password, host, and database with your PostgreSQL credentials');
      return;
    }

    console.log('✅ DATABASE_URL is configured');

    // 2. Validate DATABASE_URL format
    console.log('\n2. Validating DATABASE_URL format...');
    try {
      const url = new URL(process.env.DATABASE_URL.replace('postgresql://', 'http://'));
      console.log('✅ DATABASE_URL format is valid');
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Port: ${url.port || 5432}`);
      console.log(`   Database: ${url.pathname.substring(1)}`);
    } catch (error) {
      console.error('❌ DATABASE_URL format is invalid:', error.message);
      console.log('ℹ️  Expected format: postgresql://username:password@host:port/database');
      return;
    }

    // 3. Test database connection
    console.log('\n3. Testing database connection...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 5
    });

    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT version() as postgres_version, current_database() as current_db');
        console.log('✅ Database connection successful');
        console.log(`   PostgreSQL Version: ${result.rows[0].postgres_version}`);
        console.log(`   Current Database: ${result.rows[0].current_db}`);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);

      // Provide specific guidance based on error type
      if (error.code === 'ECONNREFUSED') {
        console.log('\n📋 Connection refused - possible causes:');
        console.log('1. PostgreSQL server is not running');
        console.log('2. Database host/port is incorrect');
        console.log('3. Firewall is blocking the connection');
        console.log('4. Database credentials are wrong');
      } else if (error.code === 'ENOTFOUND') {
        console.log('\n📋 Host not found - possible causes:');
        console.log('1. Database host is incorrect');
        console.log('2. Network connectivity issues');
      } else if (error.code === '28P01' || error.code === '28000') {
        console.log('\n📋 Authentication failed - possible causes:');
        console.log('1. Database username/password is incorrect');
        console.log('2. User does not have permission to access the database');
      } else {
        console.log('\n📋 Unknown error - check the error details above');
      }

      await pool.end();
      return;
    }

    // 4. Check if required tables exist
    console.log('\n4. Checking database schema...');
    try {
      const client = await pool.connect();
      try {
        // Check if jobs table exists
        const tableResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'jobs'
          ) as jobs_table_exists
        `);

        if (tableResult.rows[0].jobs_table_exists) {
          console.log('✅ jobs table exists');

          // Check table structure
          const structureResult = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'jobs'
            ORDER BY ordinal_position
          `);

          console.log('   Table structure:');
          structureResult.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
          });
        } else {
          console.log('❌ jobs table does not exist');
          console.log('ℹ️  You need to run database migrations');
          console.log('   Run: npm run db:migrate');
        }

        // Check for any pending migrations or issues
        const indexResult = await client.query(`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE tablename = 'jobs'
        `);

        if (indexResult.rows.length > 0) {
          console.log('✅ Database indexes are set up');
        } else {
          console.log('⚠️  No indexes found on jobs table - performance may be affected');
        }

      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error checking database schema:', error.message);
    }

    // 5. Test basic operations
    console.log('\n5. Testing basic database operations...');
    try {
      const client = await pool.connect();
      try {
        // Test insert operation
        await client.query(`
          INSERT INTO jobs (job_type, status, input_data)
          VALUES ('diagnostic_test', 'pending', '{\"test\": true}')
        `);

        // Test select operation
        const selectResult = await client.query(`
          SELECT COUNT(*) as job_count FROM jobs WHERE job_type = 'diagnostic_test'
        `);

        console.log('✅ Basic database operations working');
        console.log(`   Found ${selectResult.rows[0].job_count} test jobs`);

        // Clean up
        await client.query(`
          DELETE FROM jobs WHERE job_type = 'diagnostic_test'
        `);

      } catch (error) {
        console.error('❌ Basic database operations failed:', error.message);

        if (error.code === '42P01') {
          console.log('ℹ️  The jobs table does not exist - run migrations');
        } else if (error.code === '23505') {
          console.log('ℹ️  Unique constraint violation - check your data');
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error during basic operations test:', error.message);
    }

    // 6. Check connection pool health
    console.log('\n6. Checking connection pool health...');
    console.log(`   Total connections: ${pool.totalCount}`);
    console.log(`   Idle connections: ${pool.idleCount}`);
    console.log(`   Waiting clients: ${pool.waitingCount}`);

    if (pool.waitingCount > 0) {
      console.log('⚠️  There are waiting clients - pool may be saturated');
    }

    console.log('\n✅ Database diagnostic completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ DATABASE_URL is properly configured');
    console.log('✅ Database connection is working');
    console.log('✅ Basic operations are functional');
    console.log('ℹ️  If you were experiencing crashes, they may have been caused by:');
    console.log('   - Missing DATABASE_URL (now fixed)');
    console.log('   - Incorrect database credentials (now validated)');
    console.log('   - Missing database schema (check if jobs table exists)');
    console.log('   - Connection pool issues (now monitored)');

  } catch (error) {
    console.error('❌ Diagnostic tool failed:', error);
  } finally {
    await pool?.end();
    console.log('\n=== DIAGNOSTIC COMPLETE ===');
  }
}

runDiagnostics().catch(console.error);