// =============================================================================
// CodeNexus Studio — 3 Bug Scenarios + OWASP + Rollback + AST data
// =============================================================================
const scenarios = [
  {
    id: 'null_pointer',
    label: 'Data Integrity — Order Pricing Payload',
    shortLabel: 'Null Pointer',
    category: 'Data Integrity',
    filename: 'OrderController.js',
    testFile: 'tests/OrderController.test.js',
    errorType: 'TypeError',
    icon: '🛒',
    language: 'nodejs',
    stackTrace: 'TypeError: Cannot read properties of undefined (reading "price")\n    at calculateTotal (OrderController.js:3:34)\n    at processOrder (OrderService.js:47:18)\n    at async handleCheckout (CheckoutHandler.js:12:5)',
    brokenCode: `// OrderController.js — BROKEN
// Bug: No null/undefined guards on nested property access

function calculateTotal(order) {
  const price = order.item.price;
  const quantity = order.quantity;
  const tax = price * 0.08;
  return (price * quantity) + tax;
}

function formatReceipt(order) {
  const total = calculateTotal(order);
  return \`Order Total: $\${total.toFixed(2)}\`;
}

module.exports = { calculateTotal, formatReceipt };`,
    patchedCode: `// OrderController.js — PATCHED by Codestral AI
// Fix: Added defensive null checks with optional chaining and defaults

function calculateTotal(order) {
  const price = order?.item?.price ?? 0;
  const quantity = order?.quantity ?? 0;
  const tax = price * 0.08;
  return (price * quantity) + tax;
}

function formatReceipt(order) {
  const total = calculateTotal(order);
  return \`Order Total: $\${total.toFixed(2)}\`;
}

module.exports = { calculateTotal, formatReceipt };`,
    testOutput: [
      { type: 'header', text: 'PASS  tests/OrderController.test.js' },
      { type: 'pass', text: '  ✓ SHOULD resolve undefined price gracefully (12 ms)' },
      { type: 'pass', text: '  ✓ SHOULD calculate total order tax correctly (8 ms)' },
      { type: 'pass', text: '  ✓ SHOULD handle missing quantity with default value (4 ms)' },
      { type: 'pass', text: '  ✓ SHOULD format receipt string correctly (6 ms)' },
      { type: 'blank', text: '' },
      { type: 'summary', text: 'Test Suites:  1 passed, 1 total' },
      { type: 'summary', text: 'Tests:        4 passed, 4 total' },
      { type: 'summary', text: 'Snapshots:    0 total' },
      { type: 'time', text: 'Time:         0.642 s' },
    ],
    telemetry: { confidence: 98.6, latency: 1.18, risk: 'Low', tokens: 342 },
    owasp: {
      prePatch: { severity: 'CRITICAL', code: 'CVE-2026-4421', label: 'Undefined Property Access', score: 2.1 },
      postPatch: { severity: 'SECURE', label: 'AST Validated — No Vulnerabilities', score: 9.8 },
    },
    astNodes: [
      { id: 'OrderController', x: 200, y: 80, broken: true, deps: ['OrderService', 'Database'] },
      { id: 'OrderService', x: 80, y: 200, broken: false, deps: ['Database'] },
      { id: 'Database', x: 200, y: 320, broken: false, deps: [] },
      { id: 'CheckoutHandler', x: 340, y: 200, broken: false, deps: ['OrderController'] },
    ],
    rollbackCheckpoints: ['Original', 'AST Mapped', 'Patch Applied', 'Validated'],
    pr: {
      number: 14,
      title: 'fix(order): add defensive null checks for order pricing payload',
      branch: 'fix/order-controller-null-safety',
      target: 'main',
      labels: ['bug', 'ai-generated', 'verified'],
      description: [
        '**Root Cause:** `calculateTotal` accesses `order.item.price` without null guards — crashes when `item` is undefined.',
        '**Fix:** Added optional chaining (`?.`) and nullish coalescing (`??`) with safe defaults.',
        '**Tests:** All 4 assertions pass, including edge cases for undefined price and missing quantity.',
        '**Risk:** Low — purely additive defensive checks with no behavioral change for valid inputs.',
      ],
      explainFix: {
        rootCause: 'The function assumes `order.item` always exists. When the checkout flow receives a partial order object (e.g., from a failed cart hydration), `order.item` is `undefined`, causing a TypeError on the `.price` access.',
        securityImpact: 'No direct security impact, but uncaught TypeErrors can crash the checkout process, creating denial-of-service conditions and lost revenue events.',
        lines: [
          { line: 4, before: 'const price = order.item.price;', after: 'const price = order?.item?.price ?? 0;', reason: 'Optional chaining prevents crash when item is undefined; nullish coalescing ensures a numeric default.' },
          { line: 5, before: 'const quantity = order.quantity;', after: 'const quantity = order?.quantity ?? 0;', reason: 'Guards against a missing quantity field on the root order object.' },
        ],
      },
    },
  },
  {
    id: 'security_sqli',
    label: 'Security Vulnerability — Unsanitized Search Query',
    shortLabel: 'SQL Injection',
    category: 'Security',
    filename: 'SearchService.js',
    testFile: 'tests/SearchService.test.js',
    errorType: 'SQLInjection',
    icon: '🛡️',
    language: 'nodejs',
    stackTrace: "SecurityAudit: CRITICAL — Raw user input interpolated into SQL query\n    at buildQuery (SearchService.js:5:18)\n    at handleSearch (SearchController.js:22:10)\n    Detected payload: ' OR 1=1; DROP TABLE users; --",
    brokenCode: `// SearchService.js — BROKEN
// Bug: Raw string interpolation in SQL — SQL injection vulnerability

const db = require('./database');

function searchProducts(userQuery) {
  // VULNERABLE: Direct string interpolation of user input
  const sql = \`SELECT * FROM products WHERE name LIKE '%\${userQuery}%'\`;
  return db.execute(sql);
}

function searchByCategory(category, limit) {
  const sql = \`SELECT * FROM products WHERE category = '\${category}' LIMIT \${limit}\`;
  return db.execute(sql);
}

module.exports = { searchProducts, searchByCategory };`,
    patchedCode: `// SearchService.js — PATCHED by Codestral AI
// Fix: Parameterized queries eliminate SQL injection surface

const db = require('./database');

function searchProducts(userQuery) {
  const sanitized = String(userQuery).trim();
  if (!sanitized) return Promise.resolve([]);
  const sql = 'SELECT * FROM products WHERE name LIKE ?';
  return db.execute(sql, [\`%\${sanitized}%\`]);
}

function searchByCategory(category, limit) {
  const safeCategory = String(category).trim();
  const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
  const sql = 'SELECT * FROM products WHERE category = ? LIMIT ?';
  return db.execute(sql, [safeCategory, safeLimit]);
}

module.exports = { searchProducts, searchByCategory };`,
    testOutput: [
      { type: 'header', text: 'PASS  tests/SearchService.test.js' },
      { type: 'pass', text: '  ✓ SHOULD use parameterized query for product search (5 ms)' },
      { type: 'pass', text: '  ✓ SHOULD reject SQL injection payloads safely (9 ms)' },
      { type: 'pass', text: '  ✓ SHOULD sanitize category input (4 ms)' },
      { type: 'pass', text: '  ✓ SHOULD clamp limit parameter to safe range (3 ms)' },
      { type: 'pass', text: '  ✓ SHOULD return empty array for blank query (2 ms)' },
      { type: 'blank', text: '' },
      { type: 'summary', text: 'Test Suites:  1 passed, 1 total' },
      { type: 'summary', text: 'Tests:        5 passed, 5 total' },
      { type: 'summary', text: 'Snapshots:    0 total' },
      { type: 'time', text: 'Time:         0.518 s' },
    ],
    telemetry: { confidence: 96.3, latency: 1.42, risk: 'Medium', tokens: 487 },
    owasp: {
      prePatch: { severity: 'CRITICAL', code: 'OWASP A03:2021', label: 'SQL Injection — Input Injection', score: 1.0 },
      postPatch: { severity: 'SECURE', label: 'Parameterized Queries — Injection Eliminated', score: 9.5 },
    },
    astNodes: [
      { id: 'SearchService', x: 200, y: 80, broken: true, deps: ['Database', 'SearchController'] },
      { id: 'SearchController', x: 80, y: 200, broken: false, deps: ['SearchService'] },
      { id: 'Database', x: 340, y: 200, broken: false, deps: [] },
      { id: 'Router', x: 200, y: 320, broken: false, deps: ['SearchController'] },
    ],
    rollbackCheckpoints: ['Original', 'AST Mapped', 'Patch Applied', 'Validated'],
    pr: {
      number: 15,
      title: 'fix(search): replace raw SQL interpolation with parameterized queries',
      branch: 'fix/search-sql-injection',
      target: 'main',
      labels: ['security', 'critical', 'ai-generated', 'verified'],
      description: [
        '**Root Cause:** `searchProducts` and `searchByCategory` interpolate user input directly into SQL strings.',
        '**Fix:** Replaced all raw interpolation with `?` placeholders and parameterized `db.execute()` calls.',
        '**Hardening:** Added input sanitization, empty-query guard, and limit clamping (1–100).',
        '**Risk:** Medium — query behavior changes slightly for edge inputs, but all injection vectors are eliminated.',
      ],
      explainFix: {
        rootCause: 'Template literals with user-controlled values are concatenated directly into the SQL query string. An attacker can inject SQL metacharacters to alter query logic, extract data, or drop tables.',
        securityImpact: 'OWASP A03:2021 Injection — rated Critical. Exploitable by unauthenticated users via the public search endpoint. Full database read/write/delete access possible.',
        lines: [
          { line: 7, before: 'const sql = `SELECT ... WHERE name LIKE \'%${userQuery}%\'`;', after: "const sql = 'SELECT ... WHERE name LIKE ?';", reason: 'Moves user input out of the query string into a parameterized placeholder, which the DB driver escapes automatically.' },
          { line: 8, before: 'return db.execute(sql);', after: 'return db.execute(sql, [`%${sanitized}%`]);', reason: 'Passes sanitized input as a separate parameter array — the DB driver handles escaping, preventing injection.' },
        ],
      },
    },
  },
  {
    id: 'async_leak',
    label: 'Performance Bottleneck — Unoptimized DB Fetch Loop',
    shortLabel: 'Async Leak',
    category: 'Performance',
    filename: 'UserBatchService.js',
    testFile: 'tests/UserBatchService.test.js',
    errorType: 'PerfDegradation',
    icon: '⚡',
    language: 'nodejs',
    stackTrace: 'PerformanceWarning: Sequential async DB calls detected — 200 queries in 14.2s\n    at enrichUsers (UserBatchService.js:8:22)\n    at processUserBatch (BatchController.js:15:12)\n    Projected parallel time: 0.28s',
    brokenCode: `// UserBatchService.js — BROKEN
// Bug: Sequential await inside loop — O(n) DB round-trips

const db = require('./database');

async function enrichUsers(userIds) {
  const results = [];
  // SLOW: Each iteration blocks until previous resolves
  for (const id of userIds) {
    const user = await db.findUserById(id);
    const profile = await db.findProfileByUserId(id);
    results.push({ ...user, profile });
  }
  return results;
}

async function getUserSummary(userIds) {
  const enriched = await enrichUsers(userIds);
  return enriched.map(u => ({
    id: u.id,
    name: u.name,
    avatar: u.profile?.avatar || '/default.png',
  }));
}

module.exports = { enrichUsers, getUserSummary };`,
    patchedCode: `// UserBatchService.js — PATCHED by Codestral AI
// Fix: Parallel batched execution with Promise.all

const db = require('./database');

async function enrichUsers(userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];

  const BATCH_SIZE = 50;
  const results = [];

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (id) => {
        const [user, profile] = await Promise.all([
          db.findUserById(id),
          db.findProfileByUserId(id),
        ]);
        return { ...user, profile };
      })
    );
    results.push(...batchResults);
  }

  return results;
}

async function getUserSummary(userIds) {
  const enriched = await enrichUsers(userIds);
  return enriched.map(u => ({
    id: u.id,
    name: u.name,
    avatar: u.profile?.avatar || '/default.png',
  }));
}

module.exports = { enrichUsers, getUserSummary };`,
    testOutput: [
      { type: 'header', text: 'PASS  tests/UserBatchService.test.js' },
      { type: 'pass', text: '  ✓ SHOULD enrich users in parallel batches (18 ms)' },
      { type: 'pass', text: '  ✓ SHOULD respect BATCH_SIZE of 50 (6 ms)' },
      { type: 'pass', text: '  ✓ SHOULD handle empty userIds array (2 ms)' },
      { type: 'pass', text: '  ✓ SHOULD combine user and profile data (9 ms)' },
      { type: 'pass', text: '  ✓ SHOULD generate summary with fallback avatar (5 ms)' },
      { type: 'pass', text: '  ✓ SHOULD process 200 users under 500ms (12 ms)' },
      { type: 'blank', text: '' },
      { type: 'summary', text: 'Test Suites:  1 passed, 1 total' },
      { type: 'summary', text: 'Tests:        6 passed, 6 total' },
      { type: 'summary', text: 'Snapshots:    0 total' },
      { type: 'time', text: 'Time:         0.381 s' },
    ],
    telemetry: { confidence: 97.4, latency: 0.94, risk: 'Low', tokens: 298 },
    owasp: {
      prePatch: { severity: 'MEDIUM', code: 'PERF-WARN-001', label: 'Sequential Async — Resource Exhaustion Risk', score: 5.2 },
      postPatch: { severity: 'SECURE', label: 'Batched Parallel Execution — Resource Optimized', score: 9.7 },
    },
    astNodes: [
      { id: 'UserBatchService', x: 200, y: 80, broken: true, deps: ['Database', 'BatchController'] },
      { id: 'BatchController', x: 80, y: 200, broken: false, deps: ['UserBatchService'] },
      { id: 'Database', x: 340, y: 200, broken: false, deps: [] },
      { id: 'EventQueue', x: 200, y: 320, broken: false, deps: ['BatchController'] },
    ],
    rollbackCheckpoints: ['Original', 'AST Mapped', 'Patch Applied', 'Validated'],
    pr: {
      number: 16,
      title: 'perf(users): parallelize sequential DB calls with batched Promise.all',
      branch: 'perf/user-batch-parallel',
      target: 'main',
      labels: ['performance', 'ai-generated', 'verified'],
      description: [
        '**Root Cause:** `enrichUsers` uses sequential `await` in a `for` loop — 200 users take ~14s.',
        '**Fix:** `Promise.all` with batch size 50 runs concurrent requests within safe connection-pool limits.',
        '**Improvement:** 200-user enrichment drops from ~14.2s → ~0.28s (50× speedup).',
        '**Risk:** Low — identical output, same DB calls, just concurrent.',
      ],
      explainFix: {
        rootCause: 'The for...of loop with sequential await creates a chain of database round-trips where each request must fully complete before the next starts. With 200 users, this multiplies the average query latency (71ms) by the count.',
        securityImpact: 'No direct security vulnerability, but the bottleneck can cause HTTP request timeouts, connection pool exhaustion, and cascading failures under load.',
        lines: [
          { line: 9, before: 'for (const id of userIds) {', after: 'const BATCH_SIZE = 50; for (let i = 0; i < userIds.length; i += BATCH_SIZE) {', reason: 'Replaces single-iteration loop with a batched loop to process 50 users per Promise.all batch.' },
          { line: 10, before: 'const user = await db.findUserById(id);', after: 'const batchResults = await Promise.all(batch.map(async (id) => { ... }));', reason: 'Promise.all fires all batch requests concurrently instead of one at a time.' },
        ],
      },
    },
  },
];

export default scenarios;
