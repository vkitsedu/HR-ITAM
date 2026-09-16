import axios from 'axios';

async function runTest() {
  const login = await axios.post('http://localhost:4005/api/auth/login', {
    email: 'it@acme.com',
    password: 'Password123!',
  });
  const token = login.data.token;
  const client = axios.create({
    baseURL: 'http://localhost:4005/api',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('1. Querying Industry Templates...');
  const tpls = await client.get('/itam/catalog/templates');
  console.log(`   ✅ Fetched ${tpls.data.length} templates:`, tpls.data.map((t: any) => t.id).join(', '));

  console.log('2. Creating Custom Category...');
  const newCat = await client.post('/itam/catalog/categories', {
    code: `TEMP_${Date.now().toString().slice(-4)}`,
    name: 'Temporary Test Equipment',
    tagPrefix: 'AST-TMP',
    minSafetyBuffer: 2,
    usefulLifeMonths: 24,
    salvageValuePercent: 5.0,
    requiresCustodySign: false,
    isSerialized: true,
    icon: 'Box',
  });
  console.log(`   ✅ Category Created: ${newCat.data.name} (${newCat.data.code}) - ID: ${newCat.data.id}`);

  console.log('3. Updating Category Properties...');
  const updated = await client.put(`/itam/catalog/categories/${newCat.data.id}`, {
    name: 'Updated Temporary Equipment',
    minSafetyBuffer: 6,
    usefulLifeMonths: 36,
  });
  console.log(`   ✅ Updated Buffer to ${updated.data.minSafetyBuffer} units and Life to ${updated.data.usefulLifeMonths}m`);

  console.log('4. Deleting Category with 0 Assets (Hard Delete)...');
  const delRes = await client.delete(`/itam/catalog/categories/${newCat.data.id}`);
  console.log(`   ✅ Deletion Result:`, delRes.data);

  console.log('5. Applying Industry Template for Healthcare...');
  const applyRes = await client.post('/itam/catalog/templates/apply', {
    templateId: 'HEALTHCARE',
    customCategories: [
      {
        code: 'MED_SCANNER',
        name: 'Diagnostic Ultrasound & ECG Scanners',
        tagPrefix: 'AST-MED',
        minSafetyBuffer: 4,
        usefulLifeMonths: 48,
        salvageValuePercent: 5.0,
        requiresCustodySign: true,
        isSerialized: true,
        icon: 'Cpu',
      },
    ],
  });
  console.log(`   ✅ Applied Template:`, applyRes.data);

  console.log('\n🎉 All Category & Onboarding Template API Endpoints Verified!');
}

runTest().catch((e) => {
  console.error('Test failed:', e.response?.data || e.message);
  process.exit(1);
});
