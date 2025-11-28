// Simplified Node.js server for Evaluation Planner
// - Prompts loaded from files (no database storage)
// - No admin functionality
// - No email functionality
// - Jobs queue for async LLM processing

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { Pool } = require('pg');
const { generateFullHtmlDocument } = require('./reportGeneratorServer.cjs');

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 5000) : 3001;

// Database setup (for jobs queue only)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Handle pool errors to prevent crashes
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
});

// Handle uncaught errors to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============================================================================
// PROMPTS - FILE-BASED LOADING
// ============================================================================
// Prompts are stored in the prompts/ directory as markdown files.
// Edit these files directly to modify prompts.

const PROMPTS_DIR = path.join(__dirname, 'prompts');

// Cache for loaded prompts
const promptsCache = new Map();

function loadPromptFromFile(stepName) {
  // Check cache first
  if (promptsCache.has(stepName)) {
    return promptsCache.get(stepName);
  }

  const filePath = path.join(PROMPTS_DIR, `${stepName}.md`);

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      promptsCache.set(stepName, content);
      return content;
    }
    return null;
  } catch (error) {
    console.error(`Error loading prompt ${stepName}:`, error);
    return null;
  }
}

// Reload prompts from files (useful for development)
function reloadPrompts() {
  promptsCache.clear();
  console.log('Prompts cache cleared');
}

// ============================================================================
// SETTINGS - ENVIRONMENT VARIABLES ONLY
// ============================================================================
// All configuration is via environment variables with sensible defaults.

function getSetting(key) {
  const envKey = key.toUpperCase();
  const value = process.env[envKey];

  if (value !== undefined && value !== '') {
    return value;
  }

  // Defaults
  const defaults = {
    'PROMPT1_MODEL': 'openai/gpt-5.1',
    'PROMPT1_TEMPERATURE': '0.7',
    'PROMPT2_MODEL': 'openai/gpt-5.1',
    'PROMPT2_TEMPERATURE': '0.7',
    'REPORT_TEMPLATE_MODEL': 'openai/gpt-5.1',
    'REPORT_TEMPLATE_TEMPERATURE': '0.7',
  };

  return defaults[envKey] || null;
}

function getOpenRouterApiKey() {
  const key = process.env.OPENROUTER_API_KEY;
  return key && key.trim() ? key.trim() : null;
}

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================================================
// OPENROUTER PROXY
// ============================================================================

// Legacy proxy endpoint - kept for backward compatibility
app.post('/openrouter-proxy', async (req, res) => {
  try {
    const { model, messages, max_tokens, temperature } = req.body;

    const apiKey = getOpenRouterApiKey();

    if (!apiKey) {
      return res.status(500).json({
        error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable.'
      });
    }

    const requestBody = {
      model,
      messages,
      max_tokens: max_tokens || 4000
    };

    if (temperature !== undefined) {
      requestBody.temperature = temperature;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      return res.status(response.status).json({
        error: `OpenRouter API error: ${response.status} - ${errorText}`
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('OpenRouter proxy error:', error);
    res.status(500).json({
      error: error.message || 'Failed to proxy request to OpenRouter'
    });
  }
});

// Main OpenRouter proxy endpoint with step-based configuration
app.post('/api/openrouter/chat/completions', async (req, res) => {
  try {
    const { step, messages, max_tokens } = req.body;

    if (!step) {
      return res.status(400).json({
        error: 'Missing step parameter. Must be one of: prompt1, prompt2, report_template'
      });
    }

    const apiKey = getOpenRouterApiKey();

    if (!apiKey) {
      return res.status(500).json({
        error: 'OpenRouter API key not configured. Please contact the administrator.'
      });
    }

    // Get model and temperature for this step from environment
    const stepKey = step.toUpperCase();
    const model = getSetting(`${stepKey}_MODEL`) || 'openai/gpt-5.1';
    const temperatureStr = getSetting(`${stepKey}_TEMPERATURE`);
    const temperature = temperatureStr ? parseFloat(temperatureStr) : undefined;

    const requestBody = {
      model,
      messages,
      max_tokens: max_tokens || 4000
    };

    if (temperature !== undefined && !isNaN(temperature)) {
      requestBody.temperature = temperature;
    }

    console.log(`Making OpenRouter API call for step: ${step}, model: ${model}, max_tokens: ${requestBody.max_tokens}`);

    // Retry logic for handling truncated responses
    let retries = 0;
    const maxRetries = 3;
    let lastError = null;

    while (retries < maxRetries) {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        console.error('Aborting request due to 5-minute timeout');
        controller.abort();
      }, 300000); // 5 minute timeout

      try {
        if (retries > 0) {
          const delay = Math.pow(2, retries) * 1000;
          console.log(`Retry attempt ${retries}/${maxRetries} after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log('Sending request to OpenRouter...');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeout);
        console.log(`OpenRouter response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenRouter API Error:', errorText);
          return res.status(response.status).json({
            error: `OpenRouter API error. Please try again or contact support if the issue persists.`
          });
        }

        console.log('Parsing OpenRouter response...');
        const responseText = await response.text();
        console.log(`Received response text of length: ${responseText.length}`);

        if (responseText.length < 500) {
          throw new Error(`Response too short (${responseText.length} chars), likely truncated`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
          console.log(`Successfully parsed JSON response with ${data.choices?.[0]?.message?.content?.length || 0} characters`);
        } catch (parseError) {
          console.error('JSON parse error:', parseError.message);
          throw new Error(`Failed to parse OpenRouter response`);
        }

        return res.json(data);

      } catch (fetchError) {
        clearTimeout(timeout);
        lastError = fetchError;

        console.error(`Attempt ${retries + 1} failed:`, {
          name: fetchError.name,
          message: fetchError.message
        });

        if (fetchError.name === 'AbortError') {
          console.error('OpenRouter request timeout after 5 minutes');
          return res.status(408).json({
            error: 'Request timeout - the response took too long to generate. Please try again or use a smaller prompt.'
          });
        }

        retries++;

        if (retries >= maxRetries) {
          console.error('Max retries reached, giving up');
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Unknown error occurred');

  } catch (error) {
    console.error('OpenRouter proxy error:', error);
    res.status(500).json({
      error: 'Failed to process request. Please try again or contact support if the issue persists.'
    });
  }
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'Backend API server is running' });
});

// ============================================================================
// PROMPTS API - FILE-BASED (PUBLIC, READ-ONLY)
// ============================================================================

// GET /api/prompts/content/:step - Get prompt content for workflow execution
app.get('/api/prompts/content/:step', (req, res) => {
  try {
    const { step } = req.params;
    const content = loadPromptFromFile(step);

    if (!content) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Error fetching prompt content:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// CONFIGURATION ENDPOINT
// ============================================================================

app.get('/api/config', (req, res) => {
  try {
    const apiKey = getOpenRouterApiKey();

    const config = {
      prompt1: {
        model: getSetting('PROMPT1_MODEL') || 'openai/gpt-5.1',
        temperature: parseFloat(getSetting('PROMPT1_TEMPERATURE') || '0.7')
      },
      prompt2: {
        model: getSetting('PROMPT2_MODEL') || 'openai/gpt-5.1',
        temperature: parseFloat(getSetting('PROMPT2_TEMPERATURE') || '0.7')
      },
      reportTemplate: {
        model: getSetting('REPORT_TEMPLATE_MODEL') || 'openai/gpt-5.1',
        temperature: parseFloat(getSetting('REPORT_TEMPLATE_TEMPERATURE') || '0.7')
      },
      openRouter: {
        configured: !!apiKey
      }
    };

    res.json(config);
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// ============================================================================
// ASYNC JOB QUEUE API
// ============================================================================

// POST /api/jobs - Create a new async job
app.post('/api/jobs', async (req, res) => {
  try {
    const { job_type, input_data } = req.body;

    if (!job_type || !input_data) {
      return res.status(400).json({
        error: 'Missing required fields: job_type, input_data'
      });
    }

    if (!['prompt1', 'prompt2', 'report_template'].includes(job_type)) {
      return res.status(400).json({
        error: 'Invalid job_type. Must be: prompt1, prompt2, or report_template'
      });
    }

    if (typeof input_data !== 'object' || !input_data.messages) {
      return res.status(400).json({
        error: 'Invalid input_data structure. Must include messages array'
      });
    }

    const result = await pool.query(
      `INSERT INTO jobs (job_type, status, input_data)
       VALUES ($1, 'pending', $2)
       RETURNING id, job_type, status, created_at`,
      [job_type, JSON.stringify(input_data)]
    );

    const job = result.rows[0];
    console.log(`Created job ${job.id} (${job_type})`);

    res.json({
      success: true,
      job_id: job.id,
      status: job.status,
      created_at: job.created_at
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/jobs/:id - Get job status and results
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, job_type, status, result_data, error, created_at, completed_at
       FROM jobs WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = result.rows[0];

    res.json({
      id: job.id,
      job_type: job.job_type,
      status: job.status,
      result: job.result_data,
      error: job.error,
      created_at: job.created_at,
      completed_at: job.completed_at
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// BACKGROUND JOB PROCESSOR
// ============================================================================

async function processNextJob() {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Get the next pending job (with row lock)
    const jobResult = await client.query(
      `SELECT id, job_type, input_data
       FROM jobs
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );

    if (jobResult.rows.length === 0) {
      await client.query('COMMIT');
      return;
    }

    const job = jobResult.rows[0];

    // Mark job as processing
    await client.query(
      `UPDATE jobs SET status = 'processing' WHERE id = $1`,
      [job.id]
    );

    await client.query('COMMIT');

    console.log(`Processing job ${job.id} (${job.job_type})...`);

    // Process the job (outside transaction)
    try {
      const inputData = job.input_data;
      const apiKey = getOpenRouterApiKey();

      if (!apiKey) {
        throw new Error('OpenRouter API key not configured.');
      }

      // Get model and temperature for this step
      const stepKey = job.job_type.toUpperCase();
      const model = getSetting(`${stepKey}_MODEL`) || 'openai/gpt-5.1';
      const temperatureStr = getSetting(`${stepKey}_TEMPERATURE`);
      const temperature = temperatureStr ? parseFloat(temperatureStr) : undefined;

      const requestBody = {
        model,
        messages: inputData.messages,
        max_tokens: inputData.max_tokens || 4000
      };

      if (temperature !== undefined && !isNaN(temperature)) {
        requestBody.temperature = temperature;
      }

      console.log(`Calling OpenRouter for job ${job.id}: model=${model}, max_tokens=${requestBody.max_tokens}`);

      // Call OpenRouter with retry logic
      let retries = 0;
      const maxRetries = 3;
      let result;

      while (retries < maxRetries) {
        try {
          if (retries > 0) {
            const delay = Math.pow(2, retries) * 1000;
            console.log(`Retry ${retries}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
          }

          const responseText = await response.text();

          if (responseText.length < 500) {
            throw new Error(`Response too short (${responseText.length} chars), likely truncated`);
          }

          const data = JSON.parse(responseText);
          result = data.choices[0].message.content;
          break;

        } catch (fetchError) {
          retries++;
          if (retries >= maxRetries) {
            throw fetchError;
          }
        }
      }

      console.log(`Job ${job.id} completed successfully (${result.length} chars)`);

      // Update job as complete
      await pool.query(
        `UPDATE jobs
         SET status = 'completed', result_data = $1, completed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [result, job.id]
      );

    } catch (processingError) {
      console.error(`Job ${job.id} failed:`, processingError);

      // Update job as failed
      await pool.query(
        `UPDATE jobs
         SET status = 'failed', error = $1, completed_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [processingError.message, job.id]
      );
    }

  } catch (error) {
    console.error('Error in processNextJob:', error);
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('Error releasing client:', releaseError);
      }
    }
  }
}

// Cleanup old jobs (runs every hour)
async function cleanupOldJobs() {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const result = await pool.query(
      `DELETE FROM jobs
       WHERE (status = 'completed' OR status = 'failed')
       AND completed_at < $1
       RETURNING id`,
      [sixHoursAgo]
    );

    if (result.rows.length > 0) {
      console.log(`Cleaned up ${result.rows.length} old jobs`);
    }
  } catch (error) {
    console.error('Error cleaning up old jobs:', error);
  }
}

// ============================================================================
// STATIC FILE SERVING (PRODUCTION)
// ============================================================================

const distPath = path.join(__dirname, 'project', 'dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer(options = {}) {
  const startHttp = options.startHttp ?? (process.env.WORKER_ONLY !== 'true');
  const enableJobProcessor = options.enableJobProcessor ?? (process.env.ENABLE_JOB_PROCESSOR !== 'false');
  const port = options.port ?? PORT;

  console.log('=== Evaluation Planner Backend ===');
  console.log(`Mode: ${startHttp ? 'API server' : 'Worker only'}`);
  console.log(`Job processor: ${enableJobProcessor ? 'enabled' : 'disabled'}`);
  console.log('Environment checks:');
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Missing'}`);
  console.log(`- OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ Set' : '✗ Missing'}`);

  try {
    console.log('\nTesting database connection...');
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    console.log('\nChecking prompts...');
    const promptFiles = ['prompt1', 'prompt2', 'report_template'];
    for (const name of promptFiles) {
      const content = loadPromptFromFile(name);
      if (content) {
        console.log(`✓ ${name}.md loaded (${content.length} chars)`);
      } else {
        console.warn(`✗ ${name}.md not found`);
      }
    }

    let jobProcessingInterval = null;
    let jobCleanupInterval = null;

    const stopBackgroundJobs = () => {
      if (jobProcessingInterval) {
        clearInterval(jobProcessingInterval);
        jobProcessingInterval = null;
      }
      if (jobCleanupInterval) {
        clearInterval(jobCleanupInterval);
        jobCleanupInterval = null;
      }
    };

    const startBackgroundJobs = () => {
      if (enableJobProcessor && !jobProcessingInterval) {
        console.log('\nStarting background job processor...');
        processNextJob().catch(err => console.error('Initial job processor error:', err));
        jobProcessingInterval = setInterval(() => {
          processNextJob().catch(err => console.error('Job processor error:', err));
        }, 5000);
        console.log('✓ Background job processor started (runs every 5 seconds)');
      }

      if (enableJobProcessor && !jobCleanupInterval) {
        jobCleanupInterval = setInterval(cleanupOldJobs, 60 * 60 * 1000);
        console.log('✓ Job cleanup scheduled (runs hourly)');
      }
    };

    startBackgroundJobs();

    let httpServer = null;

    if (startHttp) {
      await new Promise((resolve, reject) => {
        httpServer = app.listen(port, '0.0.0.0', (error) => {
          if (error) {
            return reject(error);
          }

          console.log(`\n✓ API server running on port ${port}`);
          console.log('=================================\n');
          resolve();
        });
      });
    } else {
      console.log('\nHTTP server disabled; running in worker-only mode.');
    }

    const shutdown = async () => {
      stopBackgroundJobs();

      if (httpServer) {
        await new Promise((resolve, reject) => {
          httpServer.close((error) => {
            if (error) {
              return reject(error);
            }
            resolve();
          });
        });
      }
    };

    return {
      app,
      pool,
      httpServer,
      startBackgroundJobs,
      stopBackgroundJobs,
      shutdown
    };
  } catch (error) {
    console.error('\n✗ FATAL ERROR during server startup:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    if (error.code === 'ECONNREFUSED') {
      if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.railway.internal')) {
        console.error('\nHint: The DATABASE_URL points to the internal Railway host.');
        console.error('      That hostname is only reachable from within Railway.');
      } else {
        console.error('\nHint: Could not reach the Postgres instance.');
      }
    }

    throw error;
  }
}

if (require.main === module) {
  startServer().catch(() => {
    process.exit(1);
  });
}

module.exports = { startServer };
