// Read-only checks: no login token or customer information is sent.
const base = new URL(process.argv[2] || 'https://api.alclean.pk');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
  throw new Error('Use an HTTP(S) backend URL without credentials.');
}
async function check(path, options = {}) {
  const response = await fetch(new URL(path, base), {
    ...options,
    redirect: 'error',
    headers: {
      'User-Agent': 'AlClean-Deployment-Check/1.0',
      Origin: 'https://localhost',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}
try {
  const health = await check('/health');
  const profile = await check('/api/auth/profile', { method: 'PUT', body: '{}' });
  console.log(`Backend: ${base.origin}`);
  console.log(`Health: HTTP ${health.status}; API version: ${health.body?.apiVersion || 'unknown'}`);
  console.log(`Profile route without login: HTTP ${profile.status} (expected 401)`);
  const capabilities = health.body?.capabilities;
  if (health.status !== 200 || !capabilities?.profileUpdate ||
      !capabilities?.shopifyOrderCancellation || profile.status !== 401) {
    console.error('FAIL: This URL is not serving the backend with both account fixes.');
    console.error('Build in the PM2 process working directory, restart that process, and check again.');
    process.exitCode = 1;
  } else {
    console.log('PASS: Profile route and Shopify cancellation build are deployed.');
    console.log('Next, verify a signed-in profile edit and a cancelled order in the app.');
  }
} catch (error) {
  console.error(`FAIL: Could not verify deployment: ${error.message}`);
  process.exitCode = 1;
}
