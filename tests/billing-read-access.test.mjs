import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

const previousDirectory = process.cwd();
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zkmap-billing-access-'));
process.chdir(directory);
after(() => {
  process.chdir(previousDirectory);
  fs.rmSync(directory, { recursive: true, force: true });
});
fs.mkdirSync('.data');
fs.writeFileSync('firebase-applet-config.json', JSON.stringify({ apiKey: 'firebase-test-key' }));
const makePayment = (id) => ({
  id, invoiceId: id, userId: id, mode: 'test', method: 'upi', creditsGranted: 10,
  amountInr: 100, subtotalInr: 100, taxInr: 0, createdAt: '2026-01-01T00:00:00Z',
});
fs.writeFileSync('.data/billing-db.json', JSON.stringify({
  payments: [makePayment('alice'), makePayment('bob')],
  creditTransactions: [{ userId: 'alice' }, { userId: 'bob' }],
  auditLogs: [{ id: 'internal-note' }],
}));

const { getInvoiceHtmlById, getSanitizedBillingState, readBillingIdentity } =
  await import('../server/razorpayStore.ts');

test('anonymous billing state retains pricing but omits account records', () => {
  const state = getSanitizedBillingState();
  assert.ok(state.plans.length);
  assert.deepEqual(state.payments, []);
  assert.deepEqual(state.creditTransactions, []);
  assert.equal(state.auditLogs, undefined);
});

test('a scoped billing state returns only the requested owner records', () => {
  const state = getSanitizedBillingState('alice');
  assert.deepEqual(state.payments.map(payment => payment.userId), ['alice']);
  assert.deepEqual(state.creditTransactions.map(record => record.userId), ['alice']);
});

test('invoice reads are limited to their owner and verified administrators', () => {
  const owner = { userId: 'alice', email: 'alice@example.test', isAdmin: false };
  assert.match(getInvoiceHtmlById('alice', owner), /Invoice alice/);
  assert.equal(getInvoiceHtmlById('bob', owner), null);
  assert.match(getInvoiceHtmlById('bob', { ...owner, isAdmin: true }), /Invoice bob/);
});

test('billing identity is derived from Firebase and rejects disabled identities', async (t) => {
  let disabled = false;
  const request = t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { idToken: 'test-token' });
    return Response.json({ users: [
      { localId: 'firebase-uid', email: 'user@example.test', emailVerified: true, disabled },
    ] });
  });
  assert.equal(await readBillingIdentity(undefined), null);
  assert.equal(request.mock.callCount(), 0);
  assert.deepEqual(await readBillingIdentity('Bearer test-token'), {
    userId: 'firebase-uid', email: 'user@example.test', isAdmin: false,
  });
  disabled = true;
  assert.equal(await readBillingIdentity('Bearer test-token'), null);
});
