import 'dotenv/config';

const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
const testDirectUrl = process.env['TEST_DIRECT_URL'];

if (!testDatabaseUrl || !testDirectUrl) {
  throw new Error('Test database environments are missing');
}

if (testDatabaseUrl === process.env['DATABASE_URL']) {
  throw new Error('Test database URL must not be the same as production DB URL');
}

process.env['DATABASE_URL'] = testDatabaseUrl;
process.env['DIRECT_URL'] = testDirectUrl;
