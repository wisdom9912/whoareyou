// Cloudflare Workers API for storing and retrieving guesses
// This file should be placed in the functions/api/ directory for Cloudflare Pages

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (request.method === 'POST') {
      // Handle POST request - store guess
      const body = await request.json();
      
      if (!body.userId || body.idx === undefined || !body.guess) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!env.WHOAREYOU_KV) {
        return new Response(
          JSON.stringify({ 
            error: 'KV storage not configured',
            message: 'Please configure WHOAREYOU_KV binding in your Cloudflare Workers settings.'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Store guess in KV
      const kvKey = `guess:${body.userId}:${body.idx}`;
      try {
        await env.WHOAREYOU_KV.put(kvKey, body.guess);
      } catch (e) {
        console.error('Error writing to KV:', e);
        return new Response(
          JSON.stringify({ error: 'Failed to save guess' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Guess saved successfully' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } 
    else if (request.method === 'GET') {
      // Handle GET request - retrieve guess
      const userId = url.searchParams.get('userId') || '';
      const idx = url.searchParams.get('idx') || '';
      
      if (!userId || idx === '') {
        return new Response(
          JSON.stringify({ error: 'userId and idx are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!env.WHOAREYOU_KV) {
        return new Response(
          JSON.stringify({ 
            guess: null,
            message: 'KV storage not configured'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const kvKey = `guess:${userId}:${idx}`;
      let guess = null;

      try {
        const data = await env.WHOAREYOU_KV.get(kvKey);
        if (data) {
          guess = data;
        }
      } catch (e) {
        console.error('Error reading from KV:', e);
      }

      return new Response(
        JSON.stringify({ guess: guess }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

