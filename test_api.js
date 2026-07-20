const API_BASE = 'http://localhost:5000/api';

async function test() {
  console.log('Logging in...');
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mahkama.ma', password: 'admin123' })
  });
  
  if (!res.ok) {
    console.log('Login failed', await res.text());
    return;
  }
  
  const data = await res.json();
  const token = data.access_token;
  console.log('Logged in successfully. Token:', token.substring(0, 20) + '...');
  
  console.log('\nFetching users...');
  const usersRes = await fetch(`${API_BASE}/users`, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('Users status:', usersRes.status);
  console.log('Users body:', await usersRes.text());
}

test().catch(console.error);
