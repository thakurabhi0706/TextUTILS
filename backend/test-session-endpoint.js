import fetch from 'node-fetch';

const BASE = 'http://localhost:4000';
let cookieJar = [];

const request = async (url, opts = {}) => {
  opts.headers = opts.headers || {};
  if (cookieJar.length) {
    opts.headers.Cookie = cookieJar.join('; ');
  }
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof URLSearchParams)) {
    opts.body = JSON.stringify(opts.body);
    opts.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, opts);
  const setCookie = res.headers.raw()['set-cookie'];
  if (setCookie) {
    setCookie.forEach(cookieText => {
      const cookiePart = cookieText.split(';')[0];
      const [name, value] = cookiePart.split('=');
      const existingIndex = cookieJar.findIndex(c => c.startsWith(`${name}=`));
      if (existingIndex !== -1) cookieJar[existingIndex] = cookiePart;
      else cookieJar.push(cookiePart);
    });
  }
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, ok: res.ok, body, headers: res.headers };
};

const run = async () => {
  const testEmail = `test+ci+${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('Registering:', testEmail);
  let result = await request(`${BASE}/api/auth/register`, {
    method: 'POST',
    body: { email: testEmail, password, name: 'CI Test' },
  });
  if (result.status === 409) {
    console.log('User already exists, logging in.');
  } else if (!result.ok) {
    console.log('Register failed:', result.status, result.body);
    return;
  } else {
    console.log('Registered successfully.');
  }

  if (!cookieJar.some(c => c.startsWith('token='))) {
    console.log('Logging in...');
    result = await request(`${BASE}/api/auth/login`, {
      method: 'POST',
      body: { email: testEmail, password },
    });
    console.log('Login:', result.status, result.body);
    if (!result.ok) return;
  }

  console.log('Creating session...');
  result = await request(`${BASE}/api/sessions/new`, {
    method: 'POST',
    body: {},
  });
  console.log('Create session:', result.status, result.body);
  if (!result.ok) return;
  const sessionId = result.body.id;

  console.log('Saving chat messages...');
  result = await request(`${BASE}/api/sessions/${sessionId}/chat-messages`, {
    method: 'POST',
    body: { messages: [{ role: 'user', text: 'Hello test' }] },
  });
  console.log('Chat save:', result.status, result.body);
  if (!result.ok) return;

  console.log('Saving session...');
  result = await request(`${BASE}/api/sessions/${sessionId}/save`, {
    method: 'POST',
    body: { days: 7 },
  });
  console.log('Save session:', result.status, result.body);
  if (!result.ok) return;

  console.log('Fetching my sessions...');
  result = await request(`${BASE}/api/sessions/mine`, { method: 'GET' });
  console.log('My sessions:', result.status, result.body);
  if (!result.ok) return;

  console.log('Deleting session...');
  result = await request(`${BASE}/api/sessions/${sessionId}`, { method: 'DELETE' });
  console.log('Delete session:', result.status, result.body);
  if (!result.ok) return;

  console.log('Test script completed successfully.');
};

run().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
