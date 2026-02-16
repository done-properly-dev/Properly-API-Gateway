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
  if (!xReplitToken) throw new Error('X_REPLIT_TOKEN not found');
  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=notion',
    { headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken } }
  ).then(res => res.json()).then(data => data.items?.[0]);
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  if (!connectionSettings || !accessToken) throw new Error('Notion not connected');
  return accessToken;
}

async function main() {
  const accessToken = await getAccessToken();
  const notion = new Client({ auth: accessToken });
  const pageId = '2ff0693d-6d13-806c-9878-cae5d0829a27';

  // Get all blocks (children) of the page
  let allBlocks: any[] = [];
  let cursor: string | undefined = undefined;
  do {
    const response: any = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: cursor,
    });
    allBlocks = allBlocks.concat(response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  // Print blocks as readable text
  for (const block of allBlocks) {
    const type = block.type;
    if (type === 'heading_1') {
      const text = block.heading_1.rich_text.map((t: any) => t.plain_text).join('');
      console.log(`\n# ${text}`);
    } else if (type === 'heading_2') {
      const text = block.heading_2.rich_text.map((t: any) => t.plain_text).join('');
      console.log(`\n## ${text}`);
    } else if (type === 'heading_3') {
      const text = block.heading_3.rich_text.map((t: any) => t.plain_text).join('');
      console.log(`\n### ${text}`);
    } else if (type === 'paragraph') {
      const text = block.paragraph.rich_text.map((t: any) => t.plain_text).join('');
      if (text) console.log(text);
    } else if (type === 'bulleted_list_item') {
      const text = block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('');
      console.log(`  • ${text}`);
    } else if (type === 'numbered_list_item') {
      const text = block.numbered_list_item.rich_text.map((t: any) => t.plain_text).join('');
      console.log(`  ${text}`);
    } else if (type === 'to_do') {
      const text = block.to_do.rich_text.map((t: any) => t.plain_text).join('');
      const checked = block.to_do.checked ? '✅' : '⬜';
      console.log(`  ${checked} ${text}`);
    } else if (type === 'toggle') {
      const text = block.toggle.rich_text.map((t: any) => t.plain_text).join('');
      console.log(`▸ ${text}`);
    } else if (type === 'divider') {
      console.log('---');
    } else if (type === 'callout') {
      const text = block.callout.rich_text.map((t: any) => t.plain_text).join('');
      console.log(`📌 ${text}`);
    } else if (type === 'table') {
      console.log('[TABLE]');
    } else if (type === 'code') {
      const text = block.code.rich_text.map((t: any) => t.plain_text).join('');
      console.log(`\`\`\`\n${text}\n\`\`\``);
    } else {
      // console.log(`[${type}]`);
    }

    // If block has children, fetch them too
    if (block.has_children) {
      const children: any = await notion.blocks.children.list({ block_id: block.id, page_size: 100 });
      for (const child of children.results) {
        const ctype = child.type;
        if (ctype === 'paragraph') {
          const text = child.paragraph.rich_text.map((t: any) => t.plain_text).join('');
          if (text) console.log(`    ${text}`);
        } else if (ctype === 'bulleted_list_item') {
          const text = child.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('');
          console.log(`    • ${text}`);
        } else if (ctype === 'numbered_list_item') {
          const text = child.numbered_list_item.rich_text.map((t: any) => t.plain_text).join('');
          console.log(`    ${text}`);
        } else if (ctype === 'to_do') {
          const text = child.to_do.rich_text.map((t: any) => t.plain_text).join('');
          const checked = child.to_do.checked ? '✅' : '⬜';
          console.log(`    ${checked} ${text}`);
        } else if (ctype === 'heading_3') {
          const text = child.heading_3.rich_text.map((t: any) => t.plain_text).join('');
          console.log(`    ### ${text}`);
        } else if (ctype === 'table_row') {
          const cells = child.table_row.cells.map((cell: any) => cell.map((t: any) => t.plain_text).join('')).join(' | ');
          console.log(`    | ${cells} |`);
        }
      }
    }
  }
}

main().catch(console.error);
