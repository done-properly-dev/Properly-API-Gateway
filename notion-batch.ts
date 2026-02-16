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

const sprint1Ids = [
  { id: '3090693d-6d13-81fd-9a88-d652bd03efd5', text: 'Add onboarding status fields to users table (onboardingStep, voiStatus, voiCompletedAt)' },
  { id: '3090693d-6d13-8119-8583-e794f7b011a7', text: 'Create playbook_articles table (id, title, content, category, order, publishedAt)' },
  { id: '3090693d-6d13-8139-8a52-c9a1bc8c8ffb', text: 'Add milestone mapping fields to matters (currentPillar, pillar1-5 status fields)' },
  { id: '3090693d-6d13-8112-a42d-eef7e27df761', text: 'Onboarding status endpoints (GET/PATCH user onboarding progress)' },
  { id: '3090693d-6d13-81ec-a2a5-fc89abed27ca', text: 'VOI verification endpoint (mock hook with success/fail response)' },
  { id: '3090693d-6d13-81cb-a6eb-c9297a6c9305', text: 'Playbook articles CRUD endpoints' },
  { id: '3090693d-6d13-81fa-9253-d7568f1b08f5', text: 'Matter milestone endpoints (5-pillar status updates)' },
  { id: '3090693d-6d13-814c-95d2-f1591c092d85', text: 'Client onboarding wizard (multi-step: welcome → personal details → VOI → contract upload)' },
  { id: '3090693d-6d13-81d7-bed2-ee193ee023f9', text: 'VOI identity verification screen (camera/upload placeholder with mock API hook)' },
  { id: '3090693d-6d13-8138-b6e0-c0c6e4ae21e9', text: '5-pillar progress bar component (visual bridge map with milestone labels)' },
  { id: '3090693d-6d13-81e8-8373-ef9900009a7c', text: 'Wire 5-pillar bar into client dashboard replacing percentage circle' },
  { id: '3090693d-6d13-8108-bd48-e189da8aaa6e', text: 'The Playbook section with placeholder educational content' },
  { id: '3090693d-6d13-81a2-a030-f7c1c70f6fed', text: 'Empty state screens with CTAs for all client views' },
  { id: '3090693d-6d13-8154-8152-f7bb6e15a04f', text: 'Apply Australian tone and voice to all client-facing copy' },
];

async function main() {
  const accessToken = await getAccessToken();
  const notion = new Client({ auth: accessToken });

  // Process in parallel batches of 3 to avoid rate limits
  for (let i = 0; i < sprint1Ids.length; i += 3) {
    const batch = sprint1Ids.slice(i, i + 3);
    await Promise.all(batch.map(todo =>
      notion.blocks.update({
        block_id: todo.id,
        to_do: {
          checked: true,
          rich_text: [{ type: 'text', text: { content: todo.text } }],
        },
      } as any).then(() => console.log(`✅ ${todo.text}`))
        .catch((e: any) => console.log(`❌ ${todo.text}: ${e.message}`))
    ));
  }
  console.log('\nDone! All Sprint 1 items checked off.');
}

main().catch(e => console.error('ERROR:', e.message || e));
