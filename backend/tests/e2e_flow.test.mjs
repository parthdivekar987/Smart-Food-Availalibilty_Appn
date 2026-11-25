/**
 * End-to-end API flow against a running backend (default http://localhost:4000).
 *
 *   node tests/e2e_flow.test.mjs            # or: npm run test:e2e
 *   API_URL=http://host:4000/api/v1 node tests/e2e_flow.test.mjs
 *
 * Covers: health, staff logins, security checks, walk-in seating, ordering,
 * kitchen + waiter status flow, bill request, payment recording, reports.
 * Uses the seeded demo accounts (password 123456). Creates one real order and
 * completes it, which frees the table again.
 */
const API = process.env.API_URL || 'http://localhost:4000/api/v1';
let passed = 0;
let failed = 0;

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  return { status: res.status, data };
};

const check = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`  ✔ ${name}`); }
  else { failed++; console.log(`  ✘ ${name} ${detail}`); }
};

const login = async (email) => {
  const r = await call('POST', '/auth/login', { body: { email, password: '123456' } });
  return r.data?.accessToken;
};

console.log(`\nE2E flow against ${API}\n`);

// 1. Health
console.log('Platform');
const health = await call('GET', '/health');
check('health endpoint reports database up', health.status === 200 && health.data?.database === 'up', JSON.stringify(health.data));
const unknown = await call('GET', '/does-not-exist');
check('unknown route returns JSON 404', unknown.status === 404 && !!unknown.data?.message);

// 2. Auth & security
console.log('Auth & security');
const admin = await login('admin@restaurant.com');
const waiter = await login('waiter@restaurant.com');
const kitchen = await login('kitchen@restaurant.com');
check('admin, waiter and kitchen can log in', !!admin && !!waiter && !!kitchen);
const badLogin = await call('POST', '/auth/login', { body: { email: 'admin@restaurant.com', password: 'wrong' } });
check('wrong password is rejected', badLogin.status === 401);
const forged = await call('GET', '/users', { token: 'demo-super_admin-token' });
check('forged demo token is rejected (no auth bypass)', forged.status === 401, `got ${forged.status}`);
const waiterOnAdmin = await call('GET', '/users', { token: waiter });
check('waiter cannot access admin user list', waiterOnAdmin.status === 403);
const login2 = await call('POST', '/auth/login', { body: { email: 'admin@restaurant.com', password: '123456' } });
const refreshed = await call('POST', '/auth/refresh', { body: { refreshToken: login2.data?.refreshToken } });
check('refresh token issues a new access token', refreshed.status === 200 && !!refreshed.data?.accessToken);

// 3. Guest: fake sessions rejected, real walk-in works
console.log('Guest seating & ordering');
const tables = await call('GET', '/guest/tables');
check('public table list available', tables.status === 200 && Array.isArray(tables.data?.data) && tables.data.data.length > 0);
check('public table list does not leak QR secrets', !JSON.stringify(tables.data).includes('qrSecret'));
const menu = await call('GET', '/guest/menu-items?page=1&limit=50');
const items = menu.data?.data || [];
check('guest menu has items', items.length > 0);
const dish = items.find((i) => i.status === 'AVAILABLE') || items[0];

const fakeOrder = await call('POST', '/orders', {
  body: { tableSessionId: 'session-demo-04-123', items: [{ id: dish.id, quantity: 1, price: dish.price }] },
});
check('order on a fake session is rejected', fakeOrder.status === 409, `got ${fakeOrder.status}`);

const badQr = await call('POST', '/guest/session', { body: { tableId: tables.data.data[0].id, token: 'valid-token' } });
check('invalid QR token is rejected', badQr.status === 400, `got ${badQr.status}`);

const walkIn = await call('POST', '/guest/walk-in', { body: {} });
check('walk-in seats guest at a free table', [200, 201].includes(walkIn.status) && !!walkIn.data?.session?.id, JSON.stringify(walkIn.data));
const sessionId = walkIn.data?.session?.id;

const order = await call('POST', '/orders', {
  // price: 1 is a tampered client price; the server must ignore it
  body: { tableSessionId: sessionId, items: [{ id: dish.id, quantity: 2, price: 1 }] },
});
check('guest places an order', order.status === 201 && !!order.data?.id, JSON.stringify(order.data));
const orderId = order.data?.id;
const total = order.data?.totalAmount;
check('server prices the order (tampered client price ignored)', total === dish.price * 2, `total ${total}, price ${dish.price}`);

const tracked = await call('GET', `/guest/orders/${sessionId}`);
check('guest can track the order', tracked.status === 200 && tracked.data?.id === orderId);

// 4. Kitchen & waiter flow
console.log('Kitchen & waiter');
const kitchenList = await call('GET', '/orders?status=RECEIVED', { token: kitchen });
check('kitchen sees the new order', (kitchenList.data?.data || []).some((o) => o.id === orderId));
for (const status of ['PREPARING', 'READY', 'SERVED']) {
  const r = await call('PATCH', `/orders/${orderId}/status`, { token: status === 'SERVED' ? waiter : kitchen, body: { status } });
  check(`order moves to ${status}`, r.status === 200, `got ${r.status} ${JSON.stringify(r.data)}`);
}
const bill = await call('POST', `/guest/orders/${orderId}/request-bill`);
check('guest requests the bill', bill.status === 200);

// 5. Payment
console.log('Payment');
const stripeIntent = await call('POST', '/payment/create-intent', { body: { orderId } });
check('card payment reports clearly when Stripe is not configured (or returns a client secret)',
  (stripeIntent.status === 400 && /not configured/i.test(stripeIntent.data?.message || '')) || !!stripeIntent.data?.clientSecret,
  JSON.stringify(stripeIntent.data));

const finalAmount = Math.round(total * 1.05 * 100) / 100;
const pay = await call('POST', '/payment/confirm-cash', {
  token: waiter,
  body: { orderId, paymentMethod: 'CASH', discountAmount: 0, discountType: null, finalAmount },
});
check('waiter records cash payment', pay.status === 200, JSON.stringify(pay.data));
const afterPay = await call('GET', `/guest/orders/${sessionId}`);
check('guest sees order COMPLETED (cache invalidated)', afterPay.data?.status === 'COMPLETED', `status ${afterPay.data?.status}`);
const reorder = await call('POST', '/orders', {
  body: { tableSessionId: sessionId, items: [{ id: dish.id, quantity: 1, price: dish.price }] },
});
check('closed session cannot be reused to order', reorder.status === 409, `got ${reorder.status}`);
const tablesAfter = await call('GET', '/guest/tables');
const freed = (tablesAfter.data?.data || []).find((t) => t.id === walkIn.data?.table?.id);
check('table is free again after payment', freed && freed.isOccupied === false);

// 6. Reports
console.log('Reports');
const start = new Date(Date.now() - 86400000).toISOString();
const end = new Date(Date.now() + 86400000).toISOString();
const payStats = await call('GET', `/reports/payment-stats?startDate=${start}&endDate=${end}`, { token: admin });
check('payment stats include the cash payment', payStats.status === 200 && JSON.stringify(payStats.data).includes('CASH'), JSON.stringify(payStats.data));
const dash = await call('GET', `/reports/dashboard?startDate=${start}&endDate=${end}`, { token: admin });
check('dashboard stats available', dash.status === 200 && typeof dash.data?.revenue === 'number', JSON.stringify(dash.data));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
