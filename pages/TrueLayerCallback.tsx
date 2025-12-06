import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

const TrueLayerCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connecting your bank...');
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      const onboardingParam = searchParams.get('onboarding');
      
      console.log('TrueLayerCallback - success:', success, 'error:', error, 'onboarding:', onboardingParam);
      console.log('TrueLayerCallback - token:', api.getToken() ? 'present' : 'missing');

      // Check if user was in onboarding flow - from URL param (survives OAuth) or localStorage (fallback)
      const isOnboarding = onboardingParam === 'true' || localStorage.getItem('onboardingName');
      const hasToken = api.getToken();

      if (success === 'true') {
        setStatus('success');
        setMessage('Your UK bank has been connected successfully!');
        
        // Redirect after showing success message
        setTimeout(() => {
          if (isOnboarding) {
            navigate('/onboarding?bank_connected=true', { replace: true });
          } else if (hasToken) {
            navigate('/dashboard/settings', { replace: true });
          } else {
            // No token but success - user got logged out, send to signin
            navigate('/signin', { replace: true });
          }
        }, 2000);
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
        
        // On error, redirect after a delay
        setTimeout(() => {
          if (isOnboarding) {
            navigate('/onboarding', { replace: true });
          } else if (hasToken) {
            navigate('/dashboard/settings', { replace: true });
          } else {
            navigate('/signin', { replace: true });
          }
        }, 3000);
        return;
      }

      // No success or error params - redirect appropriately
      if (isOnboarding) {
        navigate('/onboarding', { replace: true });
      } else if (hasToken) {
        navigate('/dashboard/settings', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

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
