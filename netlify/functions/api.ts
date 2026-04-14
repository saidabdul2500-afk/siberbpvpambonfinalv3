import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const scriptUrl = process.env.APPS_SCRIPT_URL;

  if (!scriptUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Konfigurasi APPS_SCRIPT_URL belum diatur.' }),
    };
  }

  // Handle GET for fetching users or requests
  if (event.httpMethod === 'GET') {
    const action = event.path.split('/').pop();
    
    try {
      let response;
      if (action === 'users') {
        response = await fetch(`${scriptUrl}?action=getUsers`);
      } else if (action === 'requests') {
        response = await fetch(`${scriptUrl}?action=getRequests`);
      } else {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
      }

      const data = await response.json();
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  // Handle POST for sync requests (existing logic)
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } catch (error: any) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
};
