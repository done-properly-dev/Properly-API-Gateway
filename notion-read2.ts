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

async function getBlockChildren(notion: Client, blockId: string, indent = 0): Promise<string[]> {
  const lines: string[] = [];
  let cursor: string | undefined = undefined;
  const prefix = '  '.repeat(indent);
  
  do {
    const response: any = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });
    
    for (const block of response.results) {
      const type = block.type;
      let text = '';
      
      if (type === 'heading_1') {
        text = block.heading_1.rich_text.map((t: any) => t.plain_text).join('');
        lines.push(`\n${prefix}# ${text}`);
      } else if (type === 'heading_2') {
        text = block.heading_2.rich_text.map((t: any) => t.plain_text).join('');
        lines.push(`\n${prefix}## ${text}`);
      } else if (type === 'heading_3') {
        text = block.heading_3.rich_text.map((t: any) => t.plain_text).join('');
        lines.push(`\n${prefix}### ${text}`);
      } else if (type === 'paragraph') {
        text = block.paragraph.rich_text.map((t: any) => t.plain_text).join('');
        if (text) lines.push(`${prefix}${text}`);
      } else if (type === 'bulleted_list_item') {
        text = block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('');
        lines.push(`${prefix}• ${text}`);
      } else if (type === 'numbered_list_item') {
        text = block.numbered_list_item.rich_text.map((t: any) => t.plain_text).join('');
        lines.push(`${prefix}${text}`);
      } else if (type === 'to_do') {
        text = block.to_do.rich_text.map((t: any) => t.plain_text).join('');
        const checked = block.to_do.checked ? '✅' : '⬜';
        lines.push(`${prefix}${checked} ${text}`);
      } else if (type === 'toggle') {
        text = block.toggle.rich_text.map((t: any) => t.plain_text).join('');
        lines.push(`${prefix}▸ ${text}`);
      } else if (type === 'divider') {
        lines.push(`${prefix}---`);
      } else if (type === 'callout') {
        text = block.callout.rich_text.map((t: any) => t.plain_text).join('');
        lines.push(`${prefix}📌 ${text}`);
      } else if (type === 'code') {
        text = block.code.rich_text.map((t: any) => t.plain_text).join('');
        lines.push(`${prefix}\`\`\`\n${text}\n\`\`\``);
      } else if (type === 'table') {
        lines.push(`${prefix}[TABLE]`);
      } else if (type === 'table_row') {
        const cells = block.table_row.cells.map((cell: any) => cell.map((t: any) => t.plain_text).join('')).join(' | ');
        lines.push(`${prefix}| ${cells} |`);
      }

      if (block.has_children) {
        const childLines = await getBlockChildren(notion, block.id, indent + 1);
        lines.push(...childLines);
      }
    }
    
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  
  return lines;
}

async function main() {
  const accessToken = await getAccessToken();
  const notion = new Client({ auth: accessToken });
  const pageId = '3090693d-6d13-813d-b63e-c312e81fe363';

  const lines = await getBlockChildren(notion, pageId);
  console.log(lines.join('\n'));
}

main().catch(e => console.error('ERROR:', e.message || e));
