// Cloudflare Workers API for storing and retrieving user registration data
// This file should be placed in the functions/api/ directory for Cloudflare Pages

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (request.method === 'POST') {
      // Handle POST request - register new user
      const body = await request.json();
      
      if (!body.userId || !body.name || !body.password) {
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

      // Check if user already exists
      const userIdKey = `user:${body.userId}`;
      const existing = await env.WHOAREYOU_KV.get(userIdKey);
      if (existing) {
        return new Response(
          JSON.stringify({ error: '이미 등록된 아이디입니다.' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Store user data
      const userData = {
        userId: body.userId,
        name: body.name,
        password: body.password,
        createdAt: Date.now()
      };

      try {
        // Store user data
        await env.WHOAREYOU_KV.put(userIdKey, JSON.stringify(userData));
        
        // Update registered IDs list
        const idsKey = 'registeredIds';
        const existingIds = await env.WHOAREYOU_KV.get(idsKey);
        let ids = [];
        if (existingIds) {
          ids = JSON.parse(existingIds);
        }
        if (!ids.includes(body.userId)) {
          ids.push(body.userId);
          await env.WHOAREYOU_KV.put(idsKey, JSON.stringify(ids));
        }
        
        // Store name mapping
        const nameMapKey = 'idToName';
        const existingNameMap = await env.WHOAREYOU_KV.get(nameMapKey);
        let nameMap = {};
        if (existingNameMap) {
          nameMap = JSON.parse(existingNameMap);
        }
        nameMap[body.userId] = body.name;
        await env.WHOAREYOU_KV.put(nameMapKey, JSON.stringify(nameMap));
        
        // Store password mapping
        const passwordMapKey = 'idToPassword';
        const existingPasswordMap = await env.WHOAREYOU_KV.get(passwordMapKey);
        let passwordMap = {};
        if (existingPasswordMap) {
          passwordMap = JSON.parse(existingPasswordMap);
        }
        passwordMap[body.userId] = body.password;
        await env.WHOAREYOU_KV.put(passwordMapKey, JSON.stringify(passwordMap));
        
      } catch (e) {
        console.error('Error writing to KV:', e);
        return new Response(
          JSON.stringify({ error: 'Failed to save user data' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'User registered successfully' }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } 
    else if (request.method === 'GET') {
      // Handle GET request - retrieve user data
      const userId = url.searchParams.get('userId') || '';
      const checkPassword = url.searchParams.get('checkPassword') || '';
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!env.WHOAREYOU_KV) {
        return new Response(
          JSON.stringify({ 
            user: null,
            message: 'KV storage not configured'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const userIdKey = `user:${userId}`;
      let userData = null;

      try {
        const data = await env.WHOAREYOU_KV.get(userIdKey);
        if (data) {
          userData = JSON.parse(data);
          
          // If password check is requested, verify it
          if (checkPassword) {
            const isValid = userData.password === checkPassword;
            return new Response(
              JSON.stringify({ valid: isValid }),
              { 
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            );
          }
          
          // Don't return password for normal requests
          delete userData.password;
        }
      } catch (e) {
        console.error('Error reading from KV:', e);
      }

      return new Response(
        JSON.stringify({ user: userData }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    else if (request.method === 'DELETE') {
      // Handle DELETE request - clear all data
      if (!env.WHOAREYOU_KV) {
        return new Response(
          JSON.stringify({ 
            error: 'KV storage not configured'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      try {
        // Get all keys
        const allKeys = await env.WHOAREYOU_KV.list();
        
        // Delete all keys
        for (const key of allKeys.keys) {
          await env.WHOAREYOU_KV.delete(key.name);
        }
        
        return new Response(
          JSON.stringify({ success: true, message: 'All data cleared' }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } catch (e) {
        console.error('Error clearing KV:', e);
        return new Response(
          JSON.stringify({ error: 'Failed to clear data' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
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

