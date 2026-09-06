"use strict";

async function runTests() {
  const baseUrl = 'http://localhost:5000';

  console.log('1. Health check:');
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const health = await healthRes.json();
  console.log(health);

  console.log('\n2. Create item:');
  const createRes = await fetch(`${baseUrl}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Learn Sequelize',
      description: 'Set up models and SQLite storage',
      completed: false
    })
  });
  const created = await createRes.json();
  console.log('Created:', created);

  console.log('\n3. Get all items:');
  const listRes = await fetch(`${baseUrl}/api/items`);
  const items = await listRes.json();
  console.log('Items list count:', items.length);

  console.log('\n4. Get item by id:');
  const getOneRes = await fetch(`${baseUrl}/api/items/${created.id}`);
  const item = await getOneRes.json();
  console.log('Fetched single item:', item.title);

  console.log('\n5. Update item:');
  const updateRes = await fetch(`${baseUrl}/api/items/${created.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true })
  });
  const updated = await updateRes.json();
  console.log('Updated item completed status:', updated.completed);

  console.log('\n6. Delete item:');
  const delRes = await fetch(`${baseUrl}/api/items/${created.id}`, {
    method: 'DELETE'
  });
  const delResult = await delRes.json();
  console.log('Delete result:', delResult);

  console.log('\n7. Verify list is now empty:');
  const finalListRes = await fetch(`${baseUrl}/api/items`);
  const finalItems = await finalListRes.json();
  console.log('Final items count:', finalItems.length);

  console.log('\nAll Sequelize tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

