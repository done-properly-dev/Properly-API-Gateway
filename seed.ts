import pg from 'pg';
import bcryptjs from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const demoUsers = [
  { email: 'sarah@example.com', name: 'Sarah Jenkins', role: 'CLIENT', password: 'password' },
  { email: 'mike@broker.com.au', name: 'Mike Chen', role: 'BROKER', password: 'password' },
  { email: 'admin@legaleagles.com.au', name: 'Legal Eagles Admin', role: 'CONVEYANCER', password: 'password' },
  { email: 'admin@properly.com.au', name: 'Platform Admin', role: 'ADMIN', password: 'password' },
];

async function seed() {
  for (const u of demoUsers) {
    const hashed = await bcryptjs.hash(u.password, 10);
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (existing.rows.length > 0) {
      console.log(`User ${u.email} already exists (${existing.rows[0].id})`);
      continue;
    }
    const result = await pool.query(
      'INSERT INTO users (id, email, password, name, role) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id',
      [u.email, hashed, u.name, u.role]
    );
    console.log(`Created ${u.email} with id ${result.rows[0].id}`);
  }

  const sarah = await pool.query("SELECT id FROM users WHERE email = 'sarah@example.com'");
  const mike = await pool.query("SELECT id FROM users WHERE email = 'mike@broker.com.au'");
  const conv = await pool.query("SELECT id FROM users WHERE email = 'admin@legaleagles.com.au'");
  
  const sarahId = sarah.rows[0].id;
  const mikeId = mike.rows[0].id;
  const convId = conv.rows[0].id;

  const matterExists = await pool.query("SELECT id FROM matters LIMIT 1");
  if (matterExists.rows.length === 0) {
    const mResult = await pool.query(
      `INSERT INTO matters (id, address, client_user_id, conveyancer_user_id, broker_id, status, milestone_percent, transaction_type, settlement_date)
       VALUES (gen_random_uuid(), '42 Wallaby Way, Sydney NSW 2000', $1, $2, $3, 'In Progress', 65, 'Buying', '2026-04-15')
       RETURNING id`,
      [sarahId, convId, mikeId]
    );
    const matterId = mResult.rows[0].id;
    console.log(`Created matter ${matterId}`);

    await pool.query(
      `INSERT INTO tasks (id, matter_id, title, status, due_date, type) VALUES
       (gen_random_uuid(), $1, 'Upload signed contract', 'COMPLETE', '2026-02-10', 'UPLOAD'),
       (gen_random_uuid(), $1, 'Confirm deposit payment', 'COMPLETE', '2026-02-14', 'ACTION'),
       (gen_random_uuid(), $1, 'Building & pest inspection', 'PENDING', '2026-02-28', 'ACTION'),
       (gen_random_uuid(), $1, 'Review Section 32', 'IN_REVIEW', '2026-03-05', 'REVIEW'),
       (gen_random_uuid(), $1, 'Upload ID verification', 'PENDING', '2026-03-10', 'UPLOAD')`,
      [matterId]
    );
    console.log('Created tasks');

    await pool.query(
      `INSERT INTO documents (id, matter_id, name, size, locked) VALUES
       (gen_random_uuid(), $1, 'Contract of Sale.pdf', '2.4 MB', true),
       (gen_random_uuid(), $1, 'Section 32 Vendor Statement.pdf', '1.8 MB', true),
       (gen_random_uuid(), $1, 'Building Inspection Report.pdf', '3.1 MB', false)`,
      [matterId]
    );
    console.log('Created documents');
  }

  const refExists = await pool.query("SELECT id FROM referrals LIMIT 1");
  if (refExists.rows.length === 0) {
    await pool.query(
      `INSERT INTO referrals (id, broker_id, client_name, client_email, status, commission) VALUES
       (gen_random_uuid(), $1, 'Sarah Jenkins', 'sarah@example.com', 'Converted', 550),
       (gen_random_uuid(), $1, 'Tom Williams', 'tom@example.com', 'Pending', 0),
       (gen_random_uuid(), $1, 'Lisa Park', 'lisa@example.com', 'Settled', 750)`,
      [mikeId]
    );
    console.log('Created referrals');
  }

  const notifExists = await pool.query("SELECT id FROM notifications LIMIT 1");
  if (notifExists.rows.length === 0) {
    await pool.query(
      `INSERT INTO notifications (id, template_name, channel, active) VALUES
       (gen_random_uuid(), 'Welcome Email', 'EMAIL', true),
       (gen_random_uuid(), 'Task Reminder SMS', 'SMS', true),
       (gen_random_uuid(), 'Settlement Complete', 'PUSH', true)`
    );
    console.log('Created notifications');
  }

  await pool.end();
  console.log('Seed complete!');
}

seed().catch(console.error);
