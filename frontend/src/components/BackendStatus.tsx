/**
 * Backend Status Indicator
 * Shows connection status with backend endpoints
 */

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'not-found'>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const checkBackendStatus = async () => {
    setStatus('checking');
    setErrorMessage('');

    try {
      // Safely access import.meta.env
      const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
      const apiUrl = env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/health`);

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          setStatus('connected');
        } else {
          setStatus('error');
          setErrorMessage('Backend returned unhealthy status');
        }
      } else {
        setStatus('error');
        setErrorMessage(`HTTP ${response.status}`);
      }
    } catch (error) {
      setStatus('error');
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setErrorMessage('Cannot connect to backend server');
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  };

  useEffect(() => {
    checkBackendStatus();
  }, []);

  if (status === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-md z-50">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <div>
            <p className="text-blue-900">Checking backend status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md z-50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-green-900">Backend Connected ✓</p>
              <p className="text-green-700 text-sm">Shopify integration working</p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-green-600 hover:text-green-800"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md z-50">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-900">Backend Not Connected</p>
            <button
              onClick={checkBackendStatus}
              className="text-red-600 hover:text-red-800"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-red-700 text-sm mb-2">{errorMessage}</p>
          
          {!showDetails ? (
            <button
              onClick={() => setShowDetails(true)}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Show fix instructions
            </button>
          ) : (
            <div className="mt-3 p-3 bg-white rounded border border-red-200 text-sm">
              <p className="text-red-900 mb-2">⚠️ Orders will save locally but won't sync to Shopify</p>
              
              <div className="space-y-2 text-red-800">
                <p className="font-medium">To fix this:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Go to <code className="bg-red-100 px-1 rounded">/server</code> directory</li>
                  <li>Run: <code className="bg-red-100 px-1 rounded">npm install</code></li>
                  <li>Create <code className="bg-red-100 px-1 rounded">.env</code> file with your keys</li>
                  <li>Run: <code className="bg-red-100 px-1 rounded">npm run dev</code></li>
                  <li>Click retry button above</li>
                </ol>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="mt-2 text-red-600 hover:text-red-800 text-xs underline"
              >
                Hide instructions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}