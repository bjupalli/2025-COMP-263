// File: labs/lab3/sampleNeo4jConnection.js
// Purpose: Minimal example to connect to Neo4j AuraDB, run a query, and print results.
// Usage (set env vars before running):
//   NEO4J_URI='neo4j+s://7bc0170a.databases.neo4j.io'
//   node labs/lab3/sampleNeo4jConnection.js

const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI || 'neo4j+s://7bc0170a.databases.neo4j.io';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD; // do NOT hardcode in code; use env vars

if (!PASSWORD) {
  console.error('ERROR: NEO4J_PASSWORD env var is not set.');
  process.exit(1);
}

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

async function main() {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });

  try {
    // Simple connectivity check
    const ping = await session.run('RETURN "connected to Neo4j" AS status');
    console.log(ping.records[0].get('status'));

    // Sample query that matches the agriculture graph from the lab
    const result = await session.run(`
      MATCH (f:Farm)-[:HAS_DEVICE]->(d:Device)-[:GENERATES]->(r:Reading)
      RETURN f{.*, label: labels(f)} AS farm,
             d{.*, label: labels(d)} AS device,
             r{.*, ts: toString(r.ts), label: labels(r)} AS reading
      ORDER BY r.ts
      LIMIT 10
    `);

    if (!result.records.length) {
      console.log('No matching graph data found. Create sample data in Neo4j Browser first.');
    } else {
      console.log('Sample rows:');
      for (const rec of result.records) {
        console.log(JSON.stringify({
          farm: rec.get('farm'),
          device: rec.get('device'),
          reading: rec.get('reading')
        }, null, 2));
      }
    }
  } catch (err) {
    console.error('Neo4j query error:', err.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(async (e) => {
  console.error('Fatal:', e);
  await driver.close();
  process.exit(1);
});

