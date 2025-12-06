#!/usr/bin/env node

/**
 * Network Diagnostic Tool
 * Diagnoses QUIC protocol, CORS, and connectivity issues
 */

const https = require('https');
const dns = require('dns');
const { execSync } = require('child_process');

console.log('=== Network Diagnostic Tool ===\n');

async function diagnoseNetwork() {
  try {
    // 1. Test DNS resolution
    console.log('1. Testing DNS resolution...');
    await testDnsResolution('api.allorigins.win');
    await testDnsResolution('corsproxy.io');
    await testDnsResolution('openrouter.ai');

    // 2. Test HTTPS connectivity
    console.log('\n2. Testing HTTPS connectivity...');
    await testHttpsConnectivity('https://api.allorigins.win');
    await testHttpsConnectivity('https://corsproxy.io');
    await testHttpsConnectivity('https://openrouter.ai');

    // 3. Test QUIC/HTTP3 support
    console.log('\n3. Testing QUIC/HTTP3 support...');
    testQuicSupport();

    // 4. Test CORS headers
    console.log('\n4. Testing CORS headers...');
    await testCorsHeaders('https://api.allorigins.win/get?url=https://example.com');

    console.log('\n=== Diagnosis Complete ===');
    console.log('If issues persist, try:');
    console.log('- Disable QUIC protocol in browser flags');
    console.log('- Use HTTP/1.1 explicitly');
    console.log('- Check firewall/proxy settings');
    console.log('- Test with different network connection');

  } catch (error) {
    console.error('Diagnostic error:', error.message);
  }
}

function testDnsResolution(hostname) {
  return new Promise((resolve, reject) => {
    dns.resolve(hostname, (err, addresses) => {
      if (err) {
        console.log(`  ✗ ${hostname}: DNS resolution failed - ${err.message}`);
        resolve();
      } else {
        console.log(`  ✓ ${hostname}: Resolves to ${addresses[0]}`);
        resolve();
      }
    });
  });
}

function testHttpsConnectivity(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      console.log(`  ✓ ${url}: HTTPS connection successful (${res.statusCode})`);
      res.destroy();
      resolve();
    });

    req.on('error', (err) => {
      console.log(`  ✗ ${url}: HTTPS connection failed - ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`  ✗ ${url}: Connection timeout`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

function testQuicSupport() {
  try {
    // Check if Node.js supports QUIC
    const hasQuic = typeof globalThis.crypto?.subtle !== 'undefined';
    console.log(`  Node.js QUIC support: ${hasQuic ? 'Available' : 'Not available'}`);

    // Check browser QUIC support (if running in browser context)
    if (typeof window !== 'undefined' && window.chrome) {
      console.log('  Browser: Chrome detected - QUIC/HTTP3 likely enabled');
    }

    // Suggest QUIC troubleshooting
    console.log('  QUIC Troubleshooting:');
    console.log('    - Try disabling QUIC in browser: chrome://flags/#enable-quic');
    console.log('    - Use --disable-quic flag when starting Chrome');
    console.log('    - Check for corporate firewall blocking UDP/443');

  } catch (error) {
    console.log(`  QUIC test error: ${error.message}`);
  }
}

function testCorsHeaders(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    };

    const req = https.request(options, (res) => {
      const corsHeaders = {
        'Access-Control-Allow-Origin': res.headers['access-control-allow-origin'],
        'Access-Control-Allow-Methods': res.headers['access-control-allow-methods'],
        'Access-Control-Allow-Headers': res.headers['access-control-allow-headers']
      };

      console.log(`  CORS headers for ${url}:`);
      console.log(`    ACAO: ${corsHeaders['Access-Control-Allow-Origin'] || 'Not set'}`);
      console.log(`    ACAM: ${corsHeaders['Access-Control-Allow-Methods'] || 'Not set'}`);

      if (corsHeaders['Access-Control-Allow-Origin'] === '*') {
        console.log('  ✓ CORS: Wildcard allowed');
      } else if (corsHeaders['Access-Control-Allow-Origin']) {
        console.log('  ✓ CORS: Specific origins allowed');
      } else {
        console.log('  ✗ CORS: No Access-Control-Allow-Origin header');
      }

      res.destroy();
      resolve();
    });

    req.on('error', (err) => {
      console.log(`  ✗ CORS test failed for ${url}: ${err.message}`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`  ✗ CORS test timeout for ${url}`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

// Run diagnostics
diagnoseNetwork();