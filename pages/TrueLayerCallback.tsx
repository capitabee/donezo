import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const TrueLayerCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your bank...');

  useEffect(() => {
    const handleCallback = () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');

      // Check if user was in onboarding flow
      const isOnboarding = localStorage.getItem('onboardingName');

      if (success === 'true') {
        setStatus('success');
        setMessage('Your UK bank has been connected successfully!');
        
        // Always redirect - user was logged in when they started the flow
        if (isOnboarding) {
          setTimeout(() => navigate('/onboarding?bank_connected=true', { replace: true }), 2000);
        } else {
          // Redirect to settings - they must have been logged in to initiate this
          setTimeout(() => navigate('/dashboard/settings', { replace: true }), 2000);
        }
        return;
      }

      if (error) {
        setStatus('error');
        const errorMessages: Record<string, string> = {
          'cancelled': 'Bank connection was cancelled.',
          'missing_params': 'Missing authorization data. Please try again.',
          'missing_code': 'No authorization code received. Please try again.',
          'invalid_state': 'Invalid session. Please try again.',
          'token_exchange_failed': 'Failed to connect to your bank. Please try again.',
          'server_error': 'Server error occurred. Please try again later.',
          'access_denied': 'Access was denied. Please try again.',
          'connection_failed': 'Failed to connect to your bank. Please try again.'
        };
        setMessage(errorMessages[error] || 'Bank connection failed. Please try again.');
        return;
      }

      // No params yet - check if this is a fresh load and redirect appropriately
      const hasParams = searchParams.toString().length > 0;
      if (!hasParams) {
        // Fresh page load without params - redirect to appropriate place
        if (isOnboarding) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/dashboard/settings', { replace: true });
        }
        return;
      }

      // Has params but not success/error - wait for timeout
      setTimeout(() => {
        if (status === 'loading') {
          setStatus('error');
          setMessage('Connection timed out. Please try again.');
        }
      }, 10000);
    };

    handleCallback();
  }, [searchParams, navigate, status]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <RefreshCw size={48} className="mx-auto text-blue-600 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Connecting Bank</h2>
            <p className="text-gray-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Bank Connected!</h2>
            <p className="text-gray-500">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting to settings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="mx-auto text-red-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Failed</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => {
                const isOnboarding = localStorage.getItem('onboardingName');
                navigate(isOnboarding ? '/onboarding' : '/dashboard/settings');
              }}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold"
            >
              {localStorage.getItem('onboardingName') ? 'Back to Onboarding' : 'Back to Settings'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TrueLayerCallback;
