/**
 * Backend Test Page
 * Test backend connectivity and Shopify integration
 */

import { useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BackendTestPage() {
  const navigate = useNavigate();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    connectivity: { status: 'success' | 'error' | 'pending'; message: string };
    testOrder: { status: 'success' | 'error' | 'pending'; message: string; data?: any };
  }>({
    connectivity: { status: 'pending', message: 'Not tested' },
    testOrder: { status: 'pending', message: 'Not tested' },
  });

  const testBackendConnectivity = async () => {
    try {
      const response = await fetch('https://app.albizco.com/api/create-shopify-order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok || response.status === 500) {
        const data = await response.json();
        if (data.error && (data.error.includes('required field') || data.error.includes('Invalid JSON'))) {
          return { status: 'success' as const, message: '✓ Backend is accessible and responding' };
        }
        return { status: 'success' as const, message: '✓ Backend is accessible' };
      } else if (response.status === 404) {
        return { status: 'error' as const, message: '✗ Backend file not found (404)' };
      } else {
        return { status: 'error' as const, message: `✗ Backend returned HTTP ${response.status}` };
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return { status: 'error' as const, message: '✗ Cannot connect to backend (CORS or network error)' };
      }
      return { status: 'error' as const, message: `✗ ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  };

  const testOrderCreation = async () => {
    try {
      const testData = {
        orderNumber: `TEST-${Date.now()}`,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+92 300 1234567',
        customerAddress: '123 Test Street, Test Area',
        city: 'Karachi',
        items: [
          {
            variantId: 'gid://shopify/ProductVariant/49804537815359', // Use real variant ID
            quantity: 1,
            title: 'Test Product',
            price: 100,
          },
        ],
        subtotal: 100,
        deliveryCharge: 200,
        total: 300,
        paymentMethod: 'cod',
      };

      const response = await fetch('https://app.albizco.com/api/create-shopify-order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          status: 'success' as const,
          message: `✓ Test order created: ${data.orderName || 'Unknown'}`,
          data: data,
        };
      } else {
        return {
          status: 'error' as const,
          message: `✗ ${data.error || 'Failed to create order'}`,
          data: data,
        };
      }
    } catch (error) {
      return {
        status: 'error' as const,
        message: `✗ ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  };

  const runTests = async () => {
    setTesting(true);

    // Test 1: Connectivity
    setResults(prev => ({ ...prev, connectivity: { status: 'pending', message: 'Testing...' } }));
    const connectivityResult = await testBackendConnectivity();
    setResults(prev => ({ ...prev, connectivity: connectivityResult }));

    // Test 2: Order creation (only if connectivity passed)
    if (connectivityResult.status === 'success') {
      setResults(prev => ({ ...prev, testOrder: { status: 'pending', message: 'Testing...' } }));
      const orderResult = await testOrderCreation();
      setResults(prev => ({ ...prev, testOrder: orderResult }));
    }

    setTesting(false);
  };

  const copyPHPCode = () => {
    const phpCode = `<?php
// See /BACKEND_PHP_FILES.md for complete code
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
// ... rest of code in BACKEND_PHP_FILES.md
?>`;
    navigator.clipboard.writeText(phpCode);
    alert('Template copied! See /BACKEND_PHP_FILES.md for complete code');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#1B4332] text-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl">Backend Test</h1>
            <p className="text-sm text-green-200">Diagnose Shopify integration</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-medium text-blue-900 mb-2">What This Tests:</h2>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Backend endpoint accessibility</li>
            <li>CORS configuration</li>
            <li>Shopify order creation</li>
            <li>Error handling</li>
          </ul>
        </div>

        {/* Run Tests Button */}
        <button
          onClick={runTests}
          disabled={testing}
          className="w-full bg-[#2D6A4F] text-white py-3 rounded-lg hover:bg-[#1B4332] disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Backend Tests'
          )}
        </button>

        {/* Test Results */}
        <div className="space-y-4">
          {/* Connectivity Test */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {results.connectivity.status === 'pending' && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                </div>
              )}
              {results.connectivity.status === 'success' && (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              )}
              {results.connectivity.status === 'error' && (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-medium mb-1">Backend Connectivity</h3>
                <p className={`text-sm ${
                  results.connectivity.status === 'success' ? 'text-green-700' :
                  results.connectivity.status === 'error' ? 'text-red-700' :
                  'text-gray-600'
                }`}>
                  {results.connectivity.message}
                </p>
              </div>
            </div>
          </div>

          {/* Order Creation Test */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {results.testOrder.status === 'pending' && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                </div>
              )}
              {results.testOrder.status === 'success' && (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              )}
              {results.testOrder.status === 'error' && (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-medium mb-1">Test Order Creation</h3>
                <p className={`text-sm ${
                  results.testOrder.status === 'success' ? 'text-green-700' :
                  results.testOrder.status === 'error' ? 'text-red-700' :
                  'text-gray-600'
                }`}>
                  {results.testOrder.message}
                </p>
                {results.testOrder.data && (
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(results.testOrder.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fix Instructions */}
        {results.connectivity.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="font-medium text-red-900 mb-3">How to Fix:</h2>
            <div className="space-y-3 text-sm text-red-800">
              <div>
                <p className="font-medium mb-1">1. Create PHP file:</p>
                <code className="block bg-red-100 p-2 rounded text-xs">
                  https://app.albizco.com/api/create-shopify-order.php
                </code>
              </div>

              <div>
                <p className="font-medium mb-1">2. Get the complete PHP code:</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-red-100 p-2 rounded text-xs">
                    /BACKEND_PHP_FILES.md
                  </code>
                  <button
                    onClick={copyPHPCode}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <p className="font-medium mb-1">3. Upload via FTP/SSH:</p>
                <code className="block bg-red-100 p-2 rounded text-xs">
                  Upload to: /api/ directory on your server
                </code>
              </div>

              <div>
                <p className="font-medium mb-1">4. Set permissions:</p>
                <code className="block bg-red-100 p-2 rounded text-xs">
                  chmod 644 create-shopify-order.php
                </code>
              </div>

              <div>
                <p className="font-medium mb-1">5. Test with curl:</p>
                <code className="block bg-red-100 p-2 rounded text-xs whitespace-pre-wrap">
                  curl https://app.albizco.com/api/create-shopify-order.php
                </code>
                <p className="text-xs text-red-600 mt-1">
                  Should return: {`{"success":false,"error":"Invalid JSON input"}`}
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">6. Run this test again</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {results.connectivity.status === 'success' && results.testOrder.status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="font-medium text-green-900 mb-2">✓ All Tests Passed!</h2>
            <p className="text-sm text-green-800">
              Your backend is properly configured and Shopify integration is working.
              Orders will now automatically sync to Shopify when customers checkout.
            </p>
          </div>
        )}

        {/* Additional Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h2 className="font-medium text-gray-900 mb-2">Backend Endpoint:</h2>
          <code className="text-xs bg-white p-2 rounded border border-gray-200 block break-all">
            https://app.albizco.com/api/create-shopify-order.php
          </code>
          
          <h2 className="font-medium text-gray-900 mt-4 mb-2">Documentation:</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <code>/BACKEND_PHP_FILES.md</code> - Complete PHP code</li>
            <li>• <code>/TROUBLESHOOTING.md</code> - Troubleshooting guide</li>
            <li>• <code>/INTEGRATION_QUICK_START.md</code> - Setup instructions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
