const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.umngrheaquytgvjkpskl:5tzG1jqrkBeFLO5Q@aws-1-eu-central-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    const query = `
      create table if not exists claims (
        id uuid primary key default uuid_generate_v4(),
        created_at timestamp with time zone default timezone('utc'::text, now()) not null,
        flight_number text not null,
        passenger_name text not null,
        pnr text not null,
        airline_email text not null,
        status text not null default 'pending'
      );
    `;
    
    await client.query(query);
    console.log("Table created successfully!");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await client.end();
  }
}

run();
