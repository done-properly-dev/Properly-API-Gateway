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

async function findTodoBlocks(notion: Client, blockId: string): Promise<{id: string, text: string, checked: boolean, parentSection: string}[]> {
  const todos: any[] = [];
  let currentSection = '';
  let cursor: string | undefined;
  
  do {
    const response: any = await notion.blocks.children.list({ block_id: blockId, page_size: 100, start_cursor: cursor });
    for (const block of response.results) {
      if (block.type === 'heading_2') {
        currentSection = block.heading_2.rich_text.map((t: any) => t.plain_text).join('');
      }
      if (block.type === 'to_do') {
        const text = block.to_do.rich_text.map((t: any) => t.plain_text).join('');
        todos.push({ id: block.id, text, checked: block.to_do.checked, parentSection: currentSection });
      }
      if (block.has_children) {
        const childTodos = await findTodoBlocks(notion, block.id);
        childTodos.forEach(t => { if (!t.parentSection) t.parentSection = currentSection; });
        todos.push(...childTodos);
      }
    }
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);
  
  return todos;
}

async function main() {
  const accessToken = await getAccessToken();
  const notion = new Client({ auth: accessToken });
  const pageId = '3090693d-6d13-813d-b63e-c312e81fe363';

  const mode = process.argv[2]; // 'list' or 'update'

  const allTodos = await findTodoBlocks(notion, pageId);
  
  if (mode === 'list') {
    let currentSection = '';
    for (const todo of allTodos) {
      if (todo.parentSection !== currentSection) {
        currentSection = todo.parentSection;
        console.log(`\n[${currentSection}]`);
      }
      console.log(`${todo.checked ? '✅' : '⬜'} ${todo.id} | ${todo.text}`);
    }
    return;
  }
  
  if (mode === 'update') {
    // Check off all Sprint 1 todos
    const sprint1Todos = allTodos.filter(t => t.parentSection === 'Sprint 1 — Client Journey Foundation' && !t.checked);
    console.log(`Found ${sprint1Todos.length} unchecked Sprint 1 todos to update`);
    
    for (const todo of sprint1Todos) {
      console.log(`Checking: ${todo.text}`);
      await notion.blocks.update({
        block_id: todo.id,
        to_do: {
          checked: true,
          rich_text: [{ type: 'text', text: { content: todo.text } }],
        },
      } as any);
    }
    console.log('Sprint 1 todos updated!');
  }
}

main().catch(e => console.error('ERROR:', e.message || e));
