import { Client } from '@notionhq/client';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=notion',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Notion not connected');
  }
  return accessToken;
}

async function main() {
  const accessToken = await getAccessToken();
  const notion = new Client({ auth: accessToken });

  // Search for Sprint 2 pages
  const results = await notion.search({
    query: 'Sprint 2',
    page_size: 10,
  });

  for (const page of results.results) {
    console.log('=== RESULT ===');
    console.log('Type:', page.object);
    console.log('ID:', page.id);
    if ('properties' in page) {
      console.log('Properties:', JSON.stringify(page.properties, null, 2));
    }
    if ('title' in page && Array.isArray((page as any).title)) {
      console.log('Title:', (page as any).title.map((t: any) => t.plain_text).join(''));
    }
    // Try to get title from properties
    if ('properties' in page) {
      for (const [key, val] of Object.entries(page.properties as any)) {
        if ((val as any).type === 'title') {
          const titleParts = (val as any).title;
          if (titleParts?.length) {
            console.log(`Title (${key}):`, titleParts.map((t: any) => t.plain_text).join(''));
          }
        }
      }
    }
    console.log('');
  }
}

main().catch(console.error);
