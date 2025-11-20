// Cloudflare Workers API for storing and retrieving opinions
// This file should be placed in the functions/api/ directory for Cloudflare Pages

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Get userId from query parameters or request body
    const userId = url.searchParams.get('userId') || '';

    if (request.method === 'POST') {
      // Handle POST request - store opinion
      const body = await request.json();
      
      if (!body.userId || !body.friendName || !body.firstImpression || !body.currentImpression) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Get existing opinions from KV or use empty array
      const kvKey = `opinions:${body.userId}`;
      let opinions = [];
      
      if (env.WHOAREYOU_KV) {
        // Use Cloudflare KV for storage
        try {
          const existing = await env.WHOAREYOU_KV.get(kvKey);
          if (existing) {
            opinions = JSON.parse(existing);
          }
        } catch (e) {
          console.error('Error reading from KV:', e);
        }

        // Add new opinion
        opinions.push({
          friendName: body.friendName,
          icon: body.icon || '',
          firstImpression: body.firstImpression,
          currentImpression: body.currentImpression,
          at: body.at || Date.now()
        });

        // Save back to KV
        try {
          await env.WHOAREYOU_KV.put(kvKey, JSON.stringify(opinions));
        } catch (e) {
          console.error('Error writing to KV:', e);
          return new Response(
            JSON.stringify({ error: 'Failed to save opinion' }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      } else {
        // Fallback: Use in-memory storage (not persistent across deployments)
        // This is a temporary solution until KV is set up
        return new Response(
          JSON.stringify({ 
            error: 'KV storage not configured. Please set up Cloudflare KV namespace.',
            message: 'Please configure WHOAREYOU_KV binding in your Cloudflare Workers settings.'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Opinion saved successfully' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } 
    else if (request.method === 'GET') {
      // Handle GET request - retrieve opinions
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const kvKey = `opinions:${userId}`;
      let opinions = [];

      if (env.WHOAREYOU_KV) {
        try {
          const data = await env.WHOAREYOU_KV.get(kvKey);
          if (data) {
            opinions = JSON.parse(data);
          }
        } catch (e) {
          console.error('Error reading from KV:', e);
        }
      } else {
        // Fallback: Return empty array if KV is not configured
        return new Response(
          JSON.stringify({ 
            opinions: [],
            message: 'KV storage not configured. Please set up Cloudflare KV namespace.'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ opinions: opinions }),
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

