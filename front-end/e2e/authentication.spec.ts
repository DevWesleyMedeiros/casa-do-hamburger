import { test, expect, clientAddress, fixtureEmail } from './fixtures';

const loginUrl = 'http://127.0.0.1:3000/auth/login';

test('limites de login permanecem ativos e a cota por origem não contamina outro cliente', async ({
  request,
}) => {
  // Alvos diferentes evitam atingir o limite por e-mail antes do limite por IP.
  for (let index = 0; index < 20; index++) {
    const response = await request.post(loginUrl, {
      data: { email: `missing-${index}-${fixtureEmail()}`, password: 'Invalid-test-only!123' },
    });
    expect(response.status()).toBe(401);
  }
  const blocked = await request.post(loginUrl, {
    data: { email: fixtureEmail(), password: 'Rf44-test-only!123' },
  });
  expect(blocked.status()).toBe(429);
  expect((await blocked.json()).message).toContain('origem');

  const independent = await request.post(loginUrl, {
    headers: { 'X-Forwarded-For': clientAddress(`independent-${test.info().testId}`) },
    data: { email: fixtureEmail(), password: 'Rf44-test-only!123' },
  });
  expect(independent.status()).toBe(200);
  expect((await request.get('http://127.0.0.1:3000/auth/me')).status()).toBe(200);

  const headers = { 'X-Forwarded-For': clientAddress(`targeted-${test.info().testId}`) };
  for (let index = 0; index < 5; index++) {
    const response = await request.post(loginUrl, {
      headers,
      data: { email: fixtureEmail(), password: 'Invalid-test-only!123' },
    });
    expect(response.status()).toBe(401);
  }
  const targeted = await request.post(loginUrl, {
    headers,
    data: { email: fixtureEmail(), password: 'Rf44-test-only!123' },
  });
  expect(targeted.status()).toBe(429);
  expect((await targeted.json()).message).toContain('e-mail');
});
