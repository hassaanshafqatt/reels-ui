// Test script to verify admin settings functionality
// This script tests the new caption length and author settings

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4761';

async function testAdminSettings() {
  try {
    console.log('Testing admin settings API...');
    
    // Test login first
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'hasnishafqat@gmail.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✓ Login successful');
    
    // Test getting settings
    const getResponse = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      throw new Error(`Get settings failed: ${getResponse.statusText}`);
    }
    
    const settingsData = await getResponse.json();
    console.log('✓ Get settings successful');
    console.log('Current settings:', settingsData.settings);
    
    // Test updating caption length
    console.log('\nTesting caption length update...');
    const updateCaptionResponse = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: 'default_caption_length',
        value: '150',
        description: 'Default maximum length for reel captions in characters'
      })
    });
    
    if (!updateCaptionResponse.ok) {
      throw new Error(`Update caption length failed: ${updateCaptionResponse.statusText}`);
    }
    
    const captionUpdateData = await updateCaptionResponse.json();
    console.log('✓ Caption length update successful:', captionUpdateData);
    
    // Test updating include author setting
    console.log('\nTesting include author update...');
    const updateAuthorResponse = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: 'include_author_by_default',
        value: 'false',
        description: 'Whether to include author information in reels by default'
      })
    });
    
    if (!updateAuthorResponse.ok) {
      throw new Error(`Update include author failed: ${updateAuthorResponse.statusText}`);
    }
    
    const authorUpdateData = await updateAuthorResponse.json();
    console.log('✓ Include author update successful:', authorUpdateData);
    
    // Test getting reel types to see if new fields are available
    console.log('\nTesting reel types with new fields...');
    const typesResponse = await fetch(`${BASE_URL}/api/reels/types`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!typesResponse.ok) {
      throw new Error(`Get reel types failed: ${typesResponse.statusText}`);
    }
    
    const typesData = await typesResponse.json();
    console.log('✓ Get reel types successful');
    
    if (typesData.types && typesData.types.length > 0) {
      const firstType = typesData.types[0];
      console.log('First reel type fields:', {
        name: firstType.name,
        caption_length: firstType.caption_length,
        include_author: firstType.include_author
      });
    }
    
    console.log('\n🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminSettings();