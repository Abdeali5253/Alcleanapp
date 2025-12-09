/**
 * Test Script - Verify Shopify Connection
 * 
 * This script tests if your Shopify credentials are working correctly.
 * Run: node test-shopify-connection.js
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const SHOPIFY_VERSION = process.env.SHOPIFY_API_VERSION || '2025-07';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 Testing Shopify Connection');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check if credentials are configured
console.log('📋 Configuration Check:');
console.log(`   Store Domain: ${SHOPIFY_DOMAIN || '❌ NOT SET'}`);
console.log(`   Admin Token:  ${SHOPIFY_TOKEN ? '✅ Set' : '❌ NOT SET'}`);
console.log(`   API Version:  ${SHOPIFY_VERSION}\n`);

if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
  console.error('❌ ERROR: Missing Shopify credentials in .env file\n');
  console.log('Please create /server/.env file with:');
  console.log('   SHOPIFY_STORE_DOMAIN=alclean-pk.myshopify.com');
  console.log('   SHOPIFY_ADMIN_API_TOKEN=your_token_here');
  console.log('   SHOPIFY_API_VERSION=2025-07\n');
  process.exit(1);
}

// Test GraphQL query to fetch shop info
async function testShopifyConnection() {
  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_VERSION}/graphql.json`;
  
  const query = `
    query {
      shop {
        name
        email
        url
        currencyCode
        primaryDomain {
          url
        }
      }
    }
  `;

  console.log('🔄 Testing connection to Shopify...\n');
  console.log(`   Endpoint: ${url}\n`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:\n`);
      console.error(errorText);
      console.log('\n💡 Possible issues:');
      console.log('   1. Invalid Admin API token');
      console.log('   2. Token doesn\'t have required permissions');
      console.log('   3. Store domain is incorrect\n');
      process.exit(1);
    }

    const result = await response.json();

    if (result.errors) {
      console.error('❌ GraphQL Errors:\n');
      console.error(JSON.stringify(result.errors, null, 2));
      console.log('\n💡 This usually means:');
      console.log('   - Token is invalid or expired');
      console.log('   - Token doesn\'t have Admin API access\n');
      process.exit(1);
    }

    if (result.data && result.data.shop) {
      console.log('✅ CONNECTION SUCCESSFUL!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Shop Information:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`   Shop Name:     ${result.data.shop.name}`);
      console.log(`   Email:         ${result.data.shop.email}`);
      console.log(`   Domain:        ${result.data.shop.primaryDomain.url}`);
      console.log(`   Currency:      ${result.data.shop.currencyCode}`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Your Shopify credentials are working correctly!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🎯 Next steps:');
      console.log('   1. Start backend server: npm run dev');
      console.log('   2. Test order creation endpoint');
      console.log('   3. Place a test order from the frontend\n');
    } else {
      console.error('❌ Unexpected response format:\n');
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Connection Error:\n');
    console.error(error.message);
    console.log('\n💡 Possible issues:');
    console.log('   1. No internet connection');
    console.log('   2. Store domain is incorrect');
    console.log('   3. Firewall blocking the request\n');
    process.exit(1);
  }
}

// Run the test
testShopifyConnection();
