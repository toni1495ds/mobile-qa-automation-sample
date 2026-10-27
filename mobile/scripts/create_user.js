// Creates a test user before the flow (COINS is optional)
const coins = typeof COINS !== 'undefined' ? Number(COINS) : 0;

const res = http.post(`${API_URL}/test/users`, {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ coins }),
});

output.user = json(res.body);
