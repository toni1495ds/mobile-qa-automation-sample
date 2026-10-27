// Adds today's steps to the test user (run create_user.js first)
const login = http.post(`${API_URL}/auth/login`, {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: output.user.email, password: output.user.password }),
});
const token = json(login.body).token;

http.post(`${API_URL}/steps/sync`, {
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), steps: Number(STEPS) }),
});
