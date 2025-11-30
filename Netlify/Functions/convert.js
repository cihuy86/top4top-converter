const axios = require('axios');

exports.handler = async function(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    const { url, platform } = JSON.parse(event.body);
    
    if (!url || !platform) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'URL and platform are required' })
      };
    }

    // Generate unique Top4Top URL
    const top4topUrl = await generateTop4TopLink(url, platform);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        originalUrl: url,
        top4topUrl: top4topUrl,
        platform: platform,
        convertedAt: new Date().toISOString()
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message 
      })
    };
  }
};

// Generate Top4Top Link
async function generateTop4TopLink(originalUrl, platform) {
  const baseUrl = "https://top4top.io";
  
  // Generate unique ID
  const uniqueId = generateUniqueId();
  const timestamp = Date.now();
  
  // Platform-specific handling
  let pathSegment;
  switch (platform) {
    case 'youtube':
      pathSegment = 'yt';
      break;
    case 'tiktok':
      pathSegment = 'tt';
      break;
    case 'spotify':
      pathSegment = 'sp';
      break;
    default:
      pathSegment = 'media';
  }
  
  // Encode original URL for tracking
  const encodedUrl = Buffer.from(originalUrl).toString('base64');
  
  // Construct Top4Top URL
  return `${baseUrl}/${pathSegment}/${uniqueId}_${timestamp}?src=${encodedUrl}&ref=converter&platform=${platform}`;
}

// Generate Unique ID
function generateUniqueId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Extract video ID from YouTube URL
function extractYouTubeId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Extract TikTok video ID
function extractTikTokId(url) {
  const regex = /tiktok\.com\/.*\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Extract Spotify ID
function extractSpotifyId(url) {
  const regex = /spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? { type: match[1], id: match[2] } : null;
}
