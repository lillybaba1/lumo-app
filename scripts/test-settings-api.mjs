/**
 * Test Settings API Response
 * Verifies what the /api/settings endpoint is actually returning
 */

async function testSettingsAPI() {
  console.log('🧪 Testing /api/settings endpoint...\n');

  const timestamp = Date.now();
  const url = `http://localhost:3000/api/settings?t=${timestamp}`;

  console.log('Fetching:', url);
  console.log('Timestamp:', new Date(timestamp).toISOString());
  console.log('');

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    console.log('Status:', response.status);
    console.log('');

    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    console.log('Response Headers:');
    console.log(JSON.stringify(headers, null, 2));
    console.log('');

    const data = await response.json();

    console.log('🖼️  Hero Image from API:');
    console.log('=' .repeat(60));
    console.log('heroBackgroundImage:', data.heroBackgroundImage);
    console.log('=' .repeat(60));
    console.log('');

    // Check if it's the default
    const defaultImage = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop';
    if (data.heroBackgroundImage === defaultImage) {
      console.log('❌ API is returning DEFAULT image (problem detected!)');
    } else if (data.heroBackgroundImage?.includes('supabase')) {
      console.log('✅ API is returning Supabase storage image (correct!)');
    } else {
      console.log('⚠️  API is returning unexpected image URL');
    }

    console.log('\n📊 Full Settings Object:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSettingsAPI().catch(console.error);
