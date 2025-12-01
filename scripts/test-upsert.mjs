/**
 * Test UPSERT functionality for Newsletter model
 * 
 * This script tests that:
 * 1. First insert creates a new newsletter
 * 2. Second insert with same date updates the existing newsletter
 * 3. Only one record exists for the date
 */

import { Newsletter } from '../src/models/newsletter.js';

async function testUpsert() {
  console.log('🧪 Testing Newsletter UPSERT functionality...\n');

  const testDate = new Date().toISOString().split('T')[0]; // Today's date (YYYY-MM-DD)

  try {
    // Test 1: Create first newsletter
    console.log('📝 Test 1: Creating first newsletter for', testDate);
    const newsletter1 = await Newsletter.create({
      publish_date: testDate,
      title: 'Test Newsletter v1',
      hook: 'This is the first version',
      sections: [
        { heading: 'Section 1', content: 'Content v1' }
      ],
      conclusion: 'Conclusion v1',
      sources: ['https://example.com/source1'],
      generation_status: 'complete',
    });
    console.log('✅ First newsletter created:', {
      id: newsletter1.id,
      title: newsletter1.title,
      hook: newsletter1.hook,
      created_at: newsletter1.created_at,
      updated_at: newsletter1.updated_at,
    });

    // Test 2: Create second newsletter with same date (should UPDATE)
    console.log('\n📝 Test 2: Creating second newsletter for same date', testDate);
    console.log('⏳ Waiting 2 seconds to see updated_at change...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newsletter2 = await Newsletter.create({
      publish_date: testDate,
      title: 'Test Newsletter v2 - UPDATED',
      hook: 'This is the UPDATED version',
      sections: [
        { heading: 'Section 1', content: 'Content v2 - UPDATED' },
        { heading: 'Section 2', content: 'New section added' }
      ],
      conclusion: 'Conclusion v2 - UPDATED',
      sources: ['https://example.com/source1', 'https://example.com/source2'],
      generation_status: 'complete',
    });
    console.log('✅ Second newsletter created/updated:', {
      id: newsletter2.id,
      title: newsletter2.title,
      hook: newsletter2.hook,
      created_at: newsletter2.created_at,
      updated_at: newsletter2.updated_at,
    });

    // Test 3: Verify only one record exists
    console.log('\n📝 Test 3: Verifying only one record exists for', testDate);
    const retrieved = await Newsletter.getByDate(testDate);
    console.log('✅ Retrieved newsletter:', {
      id: retrieved.id,
      title: retrieved.title,
      sections_count: retrieved.sections.length,
      sources_count: retrieved.sources.length,
    });

    // Test 4: Verify it's the updated version
    console.log('\n📝 Test 4: Verifying data was updated (not duplicated)');
    const checks = {
      'Same ID': newsletter1.id === newsletter2.id,
      'Title updated': retrieved.title === 'Test Newsletter v2 - UPDATED',
      'Hook updated': retrieved.hook === 'This is the UPDATED version',
      'Sections updated': retrieved.sections.length === 2,
      'Sources updated': retrieved.sources.length === 2,
      'updated_at changed': new Date(newsletter2.updated_at) > new Date(newsletter1.updated_at),
    };

    console.log('Verification results:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    });

    const allPassed = Object.values(checks).every(v => v === true);

    if (allPassed) {
      console.log('\n🎉 All tests passed! UPSERT is working correctly.');
      console.log('✅ Same-day updates will replace the existing newsletter.');
    } else {
      console.log('\n❌ Some tests failed. Please check the implementation.');
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await Newsletter.delete(testDate);
    console.log('✅ Test newsletter deleted');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

testUpsert();
