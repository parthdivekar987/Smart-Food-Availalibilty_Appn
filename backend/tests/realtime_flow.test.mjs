/**
 * Real-time end-to-end test (needs the backend running; default http://localhost:4000).
 *   node tests/realtime_flow.test.mjs     # or: npm run test:realtime
 *
 * Simulates two guest phones at one table, a waiter, the owner (admin) and an
 * unauthenticated attacker socket, and checks every notification + security boundary
 * from seating to checkout.
 */
import { io } from 'socket.io-client';

const ORIGIN = process.env.API_ORIGIN || 'http://localhost:4000';
const API = `${ORIGIN}/api/v1`;
let passed = 0;
let failed = 0;
const check = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`  ✔ ${name}`); } else { failed++; console.log(`  ✘ ${name} ${detail}`); }
};

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { status: res.status, data };
};
const login = async (email) => (await call('POST', '/auth/login', { body: { email, password: '123456' } })).data;

/** Connect and record every event a socket receives */
const connect = (label) =>
  new Promise((resolve, reject) => {
    const s = io(ORIGIN, { transports: ['websocket'], forceNew: true, reconnection: false });
    s.label = label;
    s.received = [];
    s.onAny((event, payload) => s.received.push({ event, payload }));
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
  });
const join = (s, data) => new Promise((resolve) => s.emit('join_room', data, resolve));
/** Wait for a matching event (already received or arriving within timeout) */
const waitFor = (s, event, pred = () => true, timeout = 8000) =>
  new Promise((resolve) => {
    const found = s.received.find((r) => r.event === event && pred(r.payload));
    if (found) return resolve(found.payload);
    const handler = (payload) => {
      if (pred(payload)) { clearTimeout(timer); s.off(event, handler); resolve(payload); }
    };
    const timer = setTimeout(() => { s.off(event, handler); resolve(null); }, timeout);
    s.on(event, handler);
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`\nRealtime flow against ${ORIGIN}\n`);
const admin = await login('admin@restaurant.com');
const waiter = await login('waiter@restaurant.com');

// ── Security on socket rooms
console.log('Socket security');
const attacker = await connect('attacker');
const attackerJoin = await join(attacker, { role: 'WAITER' });
check('staff room without a token is refused', attackerJoin?.ok === false);
check('refused socket is told why (room_error)', !!(await waitFor(attacker, 'room_error')));
const forgedJoin = await join(attacker, { role: 'ADMIN', token: 'not-a-real-jwt' });
check('staff room with a forged token is refused', forgedJoin?.ok === false);
const waiterOnAdmin = await join(await connect('w2'), { role: 'ADMIN', token: waiter.accessToken });
check('waiter token cannot join the admin room', waiterOnAdmin?.ok === false);

const adminSock = await connect('admin');
const waiterSock = await connect('waiter');
check('admin joins live feed with a valid token', (await join(adminSock, { role: 'ADMIN', token: admin.accessToken }))?.ok === true);
check('waiter joins live feed with a valid token', (await join(waiterSock, { role: 'WAITER', token: waiter.accessToken }))?.ok === true);

// ── Seating
console.log('Seating & cart activity');
const walk = await call('POST', '/guest/walk-in', { body: {} });
const sessionId = walk.data?.session?.id;
const tableName = walk.data?.table?.name;
check('guest is seated (walk-in)', !!sessionId, JSON.stringify(walk.data));
check('owner sees "seated" activity live',
  !!(await waitFor(adminSock, 'session_activity', (e) => e.tableSessionId === sessionId && e.type === 'SESSION_STARTED')));

const phoneA = await connect('phoneA');
const phoneB = await connect('phoneB');
check('phone A joins the table session', (await join(phoneA, { role: 'CUSTOMER', tableSessionId: sessionId }))?.ok === true);
check('phone B (same table) joins the session', (await join(phoneB, { role: 'CUSTOMER', tableSessionId: sessionId }))?.ok === true);

const menu = (await call('GET', '/guest/menu-items?page=1&limit=50')).data.data.filter((m) => m.status === 'AVAILABLE');
const bread = menu.find((m) => /naan|roti|bread/i.test(m.name)) || menu[0];
const dish = menu.find((m) => m.id !== bread.id) || menu[0];

phoneA.emit('cart_activity', { tableSessionId: sessionId, menuItemId: bread.id, quantity: 1 });
const cartEvt = await waitFor(adminSock, 'session_activity', (e) => e.tableSessionId === sessionId && e.type === 'CART_ITEM_ADDED');
check(`owner sees a single item added to cart live ("${bread.name}")`, cartEvt?.data?.name === bread.name, JSON.stringify(cartEvt));
check('cart item name/price come from the server, not the client', cartEvt?.data?.unitPrice === bread.price);

attacker.emit('cart_activity', { tableSessionId: sessionId, menuItemId: dish.id, quantity: 3 });
await sleep(1200);
const spoofed = adminSock.received.some((r) => r.event === 'session_activity' && r.payload.type === 'CART_ITEM_ADDED' && r.payload.data?.quantity === 3);
check('a socket outside the table cannot inject cart activity', !spoofed);

// ── Ordering
console.log('Ordering & staff additions');
const order = await call('POST', '/orders', { body: { tableSessionId: sessionId, items: [{ id: dish.id, quantity: 1, price: dish.price }] } });
check('guest places an order', order.status === 201, JSON.stringify(order.data));
check('waiter gets the new order live', !!(await waitFor(waiterSock, 'new_order', (o) => (o.id || o.orderId) === order.data?.id)));
check('owner sees "ordered" activity', !!(await waitFor(adminSock, 'session_activity', (e) => e.tableSessionId === sessionId && e.type === 'ORDER_PLACED')));

const add = await call('POST', `/orders/session/${sessionId}/items`, { token: waiter.accessToken, body: { items: [{ id: bread.id, quantity: 2 }] } });
check('waiter adds 2 × bread to the table', add.status === 201, JSON.stringify(add.data));
check('order total recalculated server-side', add.data?.totalAmount === dish.price + 2 * bread.price, `${add.data?.totalAmount}`);
const notifA = await waitFor(phoneA, 'order_items_added', (d) => d.tableSessionId === sessionId);
const notifB = await waitFor(phoneB, 'order_items_added', (d) => d.tableSessionId === sessionId);
check('phone A is notified that staff added items', notifA?.items?.[0]?.quantity === 2 && notifA?.items?.[0]?.name === bread.name, JSON.stringify(notifA));
check('phone B (same table) is notified too', !!notifB);
check('notification names who added it', !!notifA?.addedBy?.name && notifA.addedBy.role === 'WAITER');
check('owner sees "staff added items" activity', !!(await waitFor(adminSock, 'session_activity', (e) => e.tableSessionId === sessionId && e.type === 'STAFF_ADDED_ITEMS')));

const guestAdd = await call('POST', `/orders/session/${sessionId}/items`, { body: { items: [{ id: bread.id, quantity: 1 }] } });
check('guests cannot use the staff add-items endpoint', guestAdd.status === 401);
const badAdd = await call('POST', `/orders/session/${sessionId}/items`, { token: waiter.accessToken, body: { items: [] } });
check('empty staff add is rejected with a clear message', badAdd.status === 400 && !!badAdd.data?.message);

// ── Bill
console.log('Bill & live tables');
const bill = await call('POST', `/guest/orders/${order.data.id}/request-bill`);
check('guest requests the bill', bill.status === 200);
check('the other phone at the table sees the bill request', !!(await waitFor(phoneB, 'bill_requested', (o) => o.tableSessionId === sessionId)));
check('owner sees "bill requested" activity', !!(await waitFor(adminSock, 'session_activity', (e) => e.tableSessionId === sessionId && e.type === 'BILL_REQUESTED')));

const live = await call('GET', '/sessions/live', { token: admin.accessToken });
const liveRow = live.data?.data?.find((s) => s.id === sessionId);
check('owner live-tables list includes the table', !!liveRow && liveRow.order?.billRequested === true, JSON.stringify(liveRow?.order));
check('guests cannot read the live tables list', (await call('GET', '/sessions/live')).status === 401);

// ── Checkout
console.log('Checkout & security logout');
const total = add.data.totalAmount;
const pay = await call('POST', '/payment/confirm-cash', {
  token: waiter.accessToken,
  body: { orderId: order.data.id, paymentMethod: 'CASH', discountAmount: 0, discountType: null, finalAmount: Math.round(total * 1.05 * 100) / 100 },
});
check('waiter records payment', pay.status === 200, JSON.stringify(pay.data));
const closedA = await waitFor(phoneA, 'session_closed', (d) => d.tableSessionId === sessionId);
const closedB = await waitFor(phoneB, 'session_closed', (d) => d.tableSessionId === sessionId);
check('phone A is logged out of the table (session_closed, PAID)', closedA?.reason === 'PAID', JSON.stringify(closedA));
check('phone B is logged out too', closedB?.reason === 'PAID');
check('logout message carries the amount paid', typeof closedA?.amountPaid === 'number');
check('owner is told the table checked out', !!(await waitFor(adminSock, 'table_session_closed', (d) => d.tableSessionId === sessionId)));

const lateSocket = await connect('phoneA-reconnect');
const lateJoin = await join(lateSocket, { role: 'CUSTOMER', tableSessionId: sessionId });
check('a phone reconnecting after checkout cannot rejoin', lateJoin?.ok === false);
check('…and is immediately told the session is closed', !!(await waitFor(lateSocket, 'session_closed', (d) => d.tableSessionId === sessionId)));
const status = await call('GET', `/sessions/${sessionId}/status`);
check('session status endpoint reports CLOSED', status.data?.status === 'CLOSED');
const reorder = await call('POST', '/orders', { body: { tableSessionId: sessionId, items: [{ id: dish.id, quantity: 1 }] } });
check('the old session can no longer order', reorder.status === 409);

const timeline = await call('GET', `/sessions/${sessionId}/events`, { token: admin.accessToken });
const types = (timeline.data?.data || []).map((e) => e.type);
const expected = ['SESSION_STARTED', 'CART_ITEM_ADDED', 'ORDER_PLACED', 'STAFF_ADDED_ITEMS', 'BILL_REQUESTED', 'PAYMENT_COMPLETED', 'SESSION_CLOSED'];
check('owner timeline has the full journey in order', expected.every((t, i) => types.indexOf(t) >= 0 && (i === 0 || types.indexOf(t) > types.indexOf(expected[i - 1]))), types.join(' → '));
const freed = (await call('GET', '/guest/tables')).data.data.find((t) => t.name === tableName);
check('table is free for the next guest', freed?.isOccupied === false);

// ── Attacker saw nothing
const leaked = attacker.received.filter((r) => ['new_order', 'bill_requested', 'session_activity', 'order_items_added', 'order_estimate_updated'].includes(r.event));
check('unauthenticated socket received no orders, bills or activity', leaked.length === 0, leaked.map((l) => l.event).join(','));

[attacker, adminSock, waiterSock, phoneA, phoneB, lateSocket].forEach((s) => s.close());
console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
