import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Valida os consumidores reais dos overrides da CLI, sem credenciais nem RPC.
const require = createRequire(import.meta.url);
const firebaseRequire = createRequire(require.resolve('firebase-tools/package.json'));
const pubsubRequire = createRequire(firebaseRequire.resolve('@google-cloud/pubsub'));
const { W3CTraceContextPropagator } = pubsubRequire('@opentelemetry/core');
const { ROOT_CONTEXT, trace, defaultTextMapSetter, defaultTextMapGetter } =
  pubsubRequire('@opentelemetry/api');

const span = {
  traceId: '0123456789abcdef0123456789abcdef',
  spanId: '0123456789abcdef',
  traceFlags: 1,
};
const carrier = {};
const propagator = new W3CTraceContextPropagator();
propagator.inject(trace.setSpanContext(ROOT_CONTEXT, span), carrier, defaultTextMapSetter);
const extracted = propagator.extract(ROOT_CONTEXT, carrier, defaultTextMapGetter);
assert.equal(trace.getSpanContext(extracted)?.traceId, span.traceId);
assert.equal(trace.getSpanContext(extracted)?.spanId, span.spanId);

const { PubSub } = firebaseRequire('@google-cloud/pubsub');
const pubsub = new PubSub({ projectId: 'casa-security-compatibility' });
assert.equal(
  pubsub.topic('compatibility').name,
  'projects/casa-security-compatibility/topics/compatibility',
);
await pubsub.close();

// Gaxios 6 usa v4 para o boundary de multipart; preserva a API CommonJS.
const gaxiosRequire = createRequire(firebaseRequire.resolve('gaxios'));
assert.match(
  gaxiosRequire('uuid').v4(),
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
);

const expressRequire = createRequire(firebaseRequire.resolve('express'));
assert.deepEqual(expressRequire('qs').parse('user[name]=Teste&items[]=a&items[]=b'), {
  user: { name: 'Teste' },
  items: ['a', 'b'],
});

console.log('Compatibilidade da CLI: W3C, PubSub local, UUID v4 e query parser aprovados.');
