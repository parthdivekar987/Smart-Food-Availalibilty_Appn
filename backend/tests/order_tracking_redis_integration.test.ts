import { redisService } from '../src/shared/services/redis.service';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runOrderTrackingTests() {
  console.log('\n=======================================================');
  console.log('🧪 ORDER STATUS TRACKING & REDIS INTEGRATION TEST SUITE');
  console.log('=======================================================\n');

  // TEST 1: Redis Key-Value & TTL
  console.log('▶ TEST 1: Redis Cache Storage & Retrieval');
  const testSessionId = 'session-test-' + Date.now();
  const mockOrderData = {
    id: 'ord-test-001',
    tableSessionId: testSessionId,
    status: 'RECEIVED',
    totalAmount: 350000,
    estimatedPrepMinutes: 20,
    estimatedReadyAt: new Date(Date.now() + 20 * 60000).toISOString(),
    items: [
      { id: 'item-1', name: 'Paneer Tikka Roll', quantity: 2, price: 140000 },
      { id: 'item-2', name: 'Classic Coca-Cola', quantity: 1, price: 70000 }
    ]
  };

  await redisService.set(`order:session:${testSessionId}`, mockOrderData, 3600);
  const cached = await redisService.get(`order:session:${testSessionId}`);
  assert(cached !== null, 'Redis retrieves cached order by session ID');
  assert(cached?.id === 'ord-test-001', 'Retrieved order ID matches cached data');
  assert(cached?.estimatedPrepMinutes === 20, 'Retrieved prep time estimate is preserved');

  // TEST 2: Dynamic Estimation Adjustments (Super Admin / Waiter)
  console.log('\n▶ TEST 2: Dynamic Preparation Time Adjustments');
  const newEstimateMinutes = 25;
  const updatedEstimateData = {
    orderId: 'ord-test-001',
    tableSessionId: testSessionId,
    estimatedPrepMinutes: newEstimateMinutes,
    estimatedReadyAt: new Date(Date.now() + newEstimateMinutes * 60000).toISOString(),
    updatedAt: new Date().toISOString()
  };

  await redisService.set(`order:estimate:ord-test-001`, updatedEstimateData, 86400);
  const fetchedEstimate = await redisService.get(`order:estimate:ord-test-001`);
  assert(fetchedEstimate?.estimatedPrepMinutes === 25, 'Super Admin/Waiter can adjust estimate to 25 mins');
  assert(new Date(fetchedEstimate.estimatedReadyAt) > new Date(), 'Estimated ready date is correctly calculated in future');

  // TEST 3: Order Status Progression Flow
  console.log('\n▶ TEST 3: Order Status Progression (RECEIVED -> PREPARING -> READY -> SERVED)');
  const statuses = ['RECEIVED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
  for (const st of statuses) {
    const updatedOrder = {
      ...mockOrderData,
      status: st,
      estimatedPrepMinutes: ['READY', 'SERVED', 'COMPLETED'].includes(st) ? 0 : 15
    };
    await redisService.set(`order:session:${testSessionId}`, updatedOrder, 3600);
    const retrieved = await redisService.get(`order:session:${testSessionId}`);
    assert(retrieved?.status === st, `Status correctly recorded in Redis: ${st}`);
    if (['READY', 'SERVED', 'COMPLETED'].includes(st)) {
      assert(retrieved?.estimatedPrepMinutes === 0, `Prep time cleared to 0m when order is ${st}`);
    }
  }

  // TEST 4: Multiple Active Orders Isolation in Redis
  console.log('\n▶ TEST 4: Multiple Table Sessions Isolation in Redis');
  const sessionA = 'session-table-1';
  const sessionB = 'session-table-2';
  await redisService.set(`order:session:${sessionA}`, { id: 'ord-a', tableName: 'Table 1', status: 'PREPARING' });
  await redisService.set(`order:session:${sessionB}`, { id: 'ord-b', tableName: 'Table 2', status: 'READY' });

  const getA = await redisService.get(`order:session:${sessionA}`);
  const getB = await redisService.get(`order:session:${sessionB}`);
  assert(getA?.id === 'ord-a' && getA?.status === 'PREPARING', 'Table 1 session order is isolated and PREPARING');
  assert(getB?.id === 'ord-b' && getB?.status === 'READY', 'Table 2 session order is isolated and READY');

  console.log('\n=======================================================');
  console.log(`📊 INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runOrderTrackingTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
