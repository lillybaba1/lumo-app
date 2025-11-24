/**
 * Test script to verify Google AI API key is valid
 *
 * Usage:
 * node test-google-api-key.js YOUR_API_KEY_HERE
 */

const https = require('https');

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('❌ Usage: node test-google-api-key.js YOUR_API_KEY');
  process.exit(1);
}

console.log('🧪 Testing Google AI API Key...');
console.log('📋 Key starts with:', apiKey.substring(0, 10) + '...');

const data = JSON.stringify({
  contents: [{
    parts: [{
      text: 'Hello, reply with just "working"'
    }]
  }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(body);
        if (response.candidates && response.candidates[0]) {
          console.log('✅ SUCCESS! API Key is valid and working!');
          console.log('📝 AI Response:', response.candidates[0].content.parts[0].text);
          console.log('\n✅ You can use this key in Vercel');
        } else {
          console.log('⚠️  API returned unexpected response:', body);
        }
      } catch (e) {
        console.log('⚠️  Could not parse response:', body);
      }
    } else if (res.statusCode === 400) {
      console.error('❌ API Key is INVALID or has wrong permissions');
      console.error('📋 Error:', body);
      console.error('\n💡 Get a new key from: https://aistudio.google.com/app/apikey');
    } else if (res.statusCode === 429) {
      console.error('⚠️  API Key quota exceeded');
      console.error('💡 Wait a few minutes or upgrade your quota');
    } else {
      console.error(`❌ Error: HTTP ${res.statusCode}`);
      console.error('📋 Response:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network error:', error.message);
});

req.write(data);
req.end();
