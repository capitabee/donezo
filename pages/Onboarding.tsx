import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, FileText, Building2, CreditCard, ArrowRight, ArrowLeft, Download, Sparkles } from 'lucide-react';
import api from '../services/api';

type OnboardingStep = 'offer' | 'bank' | 'card' | 'complete';

const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('offer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [bankConnecting, setBankConnecting] = useState(false);
  const [bankConnected, setBankConnected] = useState(false);
  const [cardConnecting, setCardConnecting] = useState(false);
  const [cardConnected, setCardConnected] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [dodgeAttempts, setDodgeAttempts] = useState(0);
  const buttonRef = React.useRef<HTMLDivElement>(null);

  const hasProcessedCallback = React.useRef(false);
  
  useEffect(() => {
    const name = localStorage.getItem('onboardingName') || 'Candidate';
    setCandidateName(name);
    
    // Prevent double processing of callbacks
    if (hasProcessedCallback.current) return;
    
    // Check for bank connected callback
    if (searchParams.get('bank_connected') === 'true') {
      hasProcessedCallback.current = true;
      setBankConnected(true);
      setCurrentStep('card');
      // Clear the URL parameter
      navigate('/onboarding', { replace: true });
    }
    
    // Check for mandate completed callback
    if (searchParams.get('mandate_connected') === 'true') {
      hasProcessedCallback.current = true;
      setCardConnected(true);
      setLoading(true);
      // Complete onboarding since both steps are done
      api.completeOnboarding()
        .then(() => {
          localStorage.removeItem('onboardingName');
          navigate('/dashboard', { replace: true });
        })
        .catch(() => {
          localStorage.removeItem('onboardingName');
          navigate('/dashboard', { replace: true });
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams, navigate]);

  const steps = [
    { id: 'offer', label: 'Job Offer', icon: <FileText className="w-5 h-5" /> },
    { id: 'bank', label: 'Bank Account', icon: <Building2 className="w-5 h-5" /> },
    { id: 'card', label: 'Debit Card', icon: <CreditCard className="w-5 h-5" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current || !termsAccepted || loading || dodgeAttempts >= 5) return;
    
    const button = buttonRef.current.getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    const buttonCenterX = button.left + button.width / 2;
    const buttonCenterY = button.top + button.height / 2;
    
    const distanceX = mouseX - buttonCenterX;
    const distanceY = mouseY - buttonCenterY;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    
    // If mouse is within 150px of the button, make it dodge
    if (distance < 150) {
      setDodgeAttempts(prev => prev + 1);
      
      // Calculate dodge direction (away from mouse)
      const angle = Math.atan2(distanceY, distanceX);
      const dodgeDistance = 120;
      const newX = -Math.cos(angle) * dodgeDistance;
      const newY = -Math.sin(angle) * dodgeDistance;
      
      setButtonPosition({ x: newX, y: newY });
      
      // Reset position after 1 second
      setTimeout(() => {
        setButtonPosition({ x: 0, y: 0 });
      }, 800);
    }
  };

  const handleAcceptOffer = async () => {
    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }
    
    // Only allow if they've tried at least 5 times or clicked successfully
    if (dodgeAttempts < 5) {
      setError('Try harder! The button is a bit playful... 😏');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.acceptTerms();
      setCurrentStep('bank');
    } catch (err: any) {
      setError(err.message || 'Failed to accept terms');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBank = async () => {
    setBankConnecting(true);
    setError('');
    
    try {
      const response = await api.getTrueLayerAuthUrl(true); // true = isOnboarding
      if (response.authUrl) {
        window.location.href = response.authUrl;
      } else {
        throw new Error('Failed to get bank connection URL');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect bank');
      setBankConnecting(false);
    }
  };

  const handleSkipBank = () => {
    setCurrentStep('card');
  };

  const handleConnectCard = async () => {
    setCardConnecting(true);
    setError('');
    
    try {
      const response = await api.createMandateSession();
      if (response.clientSecret) {
        localStorage.setItem('mandateClientSecret', response.clientSecret);
        navigate('/mandate-setup');
      } else {
        throw new Error('Failed to create payment setup');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to setup card');
      setCardConnecting(false);
    }
  };

  const handleSkipCard = async () => {
    setLoading(true);
    try {
      await api.completeOnboarding();
      localStorage.removeItem('onboardingName');
      navigate('/dashboard');
    } catch (err) {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.completeOnboarding();
      localStorage.removeItem('onboardingName');
      navigate('/dashboard');
    } catch (err) {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const renderOfferLetter = () => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Official Job Offer</h2>
            <p className="text-white/80">Digital Task Associate Position</p>
          </div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <span className="text-3xl font-bold text-white">D</span>
          </div>
        </div>
      </div>

      <div className="p-8 max-h-[60vh] overflow-y-auto">
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Dear <span className="font-semibold text-primary-700">{candidateName}</span>,
          </p>
          
          <p className="text-gray-600 mb-6">
            We are pleased to offer you the position of <strong>Digital Task Associate</strong> at Donezo. This role is part of our growing digital operations team, designed to help users participate in structured online tasks and activities through our platform.
          </p>

          <p className="text-gray-600 mb-6">
            This letter confirms your onboarding, responsibilities, performance structure, and additional terms.
          </p>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">1. Position Details</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Job Title:</span><span className="font-medium">Digital Task Associate</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Department:</span><span className="font-medium">Digital Operations</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Work Type:</span><span className="font-medium">Remote / App-Based</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reporting To:</span><span className="font-medium">Digital Operations Manager</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Work Location:</span><span className="font-medium">Online (accessible from your device)</span></div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">2. Role Purpose</h3>
            <p className="text-gray-600">
              As a Digital Task Associate, you will perform daily digital activities within our platform. These may include reviewing content, interacting with online media, completing assigned tasks, and supporting overall platform activity. Your role directly contributes to improving digital engagement quality and operational efficiency.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">3. Key Responsibilities</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Completing assigned digital tasks through the platform</li>
              <li>Following instructions for content-based or engagement-based activities</li>
              <li>Ensuring accuracy and timely completion of tasks</li>
              <li>Reporting task completion through the app</li>
              <li>Maintaining output quality in line with company standards</li>
              <li>Participating in occasional training or updates as required</li>
            </ul>
            <p className="text-gray-500 italic mt-4">(Your daily tasks will appear inside the app dashboard.)</p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">4. Working Schedule</h3>
            <p className="text-gray-600">
              This role allows flexibility. Tasks can be completed at any time within the daily or weekly requirement, unless otherwise specified inside the system.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">5. Performance & Earnings</h3>
            <p className="text-gray-600 mb-4">Your performance is evaluated based on:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Number of tasks completed</li>
              <li>Accuracy and consistency</li>
              <li>Following task guidelines</li>
            </ul>
            <p className="text-gray-600 mt-4">
              Earnings are based on the platform's performance structure, which is automatically calculated within the app. Your balance will be visible in your dashboard.
            </p>
            <p className="text-primary-700 font-medium mt-4">
              No payment is requested upfront. Your earnings are released as per the platform's weekly/monthly schedule.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">6. Eligibility</h3>
            <p className="text-gray-600 mb-4">To remain eligible for this role, you must:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Maintain an active account</li>
              <li>Complete minimum required tasks</li>
              <li>Follow platform guidelines and community rules</li>
              <li>Avoid misuse, fraud, or automation not approved by the system</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">7. Confidentiality</h3>
            <p className="text-gray-600">
              All information provided by the company, including tasks, systems, and internal processes, must remain confidential and not be shared externally.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">8. Termination</h3>
            <p className="text-gray-600 mb-4">Your association with the company may be paused or discontinued if:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Tasks are not completed regularly</li>
              <li>Guidelines are violated</li>
              <li>Misuse or fraudulent activities are detected</li>
            </ul>
            <p className="text-gray-600 mt-4">
              You may also request to deactivate your account at any time.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">9. Acceptance of Offer</h3>
            <p className="text-gray-600">
              To accept this offer, simply continue with your onboarding inside the app and acknowledge the Digital Associate Agreement.
            </p>
          </div>

          <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-xl p-6 mt-8 border border-primary-100">
            <p className="text-gray-700 text-center">
              We are excited to welcome you to the Digital Operations Team.<br />
              <span className="font-semibold">We look forward to supporting your growth and performance through our platform.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-8 py-6 bg-gray-50">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-gray-600">
            I have read and accept the Job Offer Letter and Terms & Conditions. I understand my responsibilities and agree to comply with all platform guidelines.
          </span>
        </label>

        <div className="flex gap-4" onMouseMove={handleMouseMove}>
          <div 
            ref={buttonRef}
            className="flex-1"
            style={{
              transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px)`,
              transition: buttonPosition.x !== 0 || buttonPosition.y !== 0 ? 'transform 0.3s ease-out' : 'none'
            }}
          >
            <button
              onClick={handleAcceptOffer}
              disabled={loading || !termsAccepted}
              className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-primary-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : dodgeAttempts >= 5 ? (
                <>
                  Okay fine, you caught me! Proceed →
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Accept & Continue {dodgeAttempts > 0 && '😏'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
        {dodgeAttempts > 0 && dodgeAttempts < 5 && (
          <p className="text-center text-purple-300 text-sm mt-3">
            Tries: {dodgeAttempts}/5 - Keep trying! 🎯
          </p>
        )}
      </div>
    </div>
  );

  const renderBankStep = () => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-8 text-center">
        <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Bank</h2>
        <p className="text-white/80">Required to receive your salary payments</p>
      </div>

      <div className="p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Secure Open Banking</p>
              <p className="text-sm text-gray-500">We use TrueLayer for bank-grade security</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Instant Verification</p>
              <p className="text-sm text-gray-500">Your bank will be verified instantly</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Direct Salary Deposits</p>
              <p className="text-sm text-gray-500">Earnings sent directly to your account</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleConnectBank}
          disabled={bankConnecting}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
        >
          {bankConnecting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Connect Bank Account
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={handleSkipBank}
          className="w-full text-gray-500 py-3 font-medium hover:text-gray-700 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

  const renderCardStep = () => (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-8 text-center">
        <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Debit Card</h2>
        <p className="text-white/80">Receive salary payments directly to your card</p>
      </div>

      <div className="p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Stripe Secure Payments</p>
              <p className="text-sm text-gray-500">Your card details are encrypted and secure</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Payment Mandate</p>
              <p className="text-sm text-gray-500">Authorize us to send payments to your card</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Fast Payouts</p>
              <p className="text-sm text-gray-500">Receive earnings within 1-3 business days</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleConnectCard}
          disabled={cardConnecting}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
        >
          {cardConnecting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              Setup Payment Method
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <button
          onClick={handleSkipCard}
          disabled={loading}
          className="w-full text-gray-500 py-3 font-medium hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Skip for now'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold">D</div>
            <span className="text-2xl font-bold text-white">Donezo</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center gap-2 ${index <= currentStepIndex ? 'text-white' : 'text-white/40'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index < currentStepIndex 
                      ? 'bg-green-500' 
                      : index === currentStepIndex 
                        ? 'bg-primary-500' 
                        : 'bg-white/10'
                  }`}>
                    {index < currentStepIndex ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="hidden sm:block font-medium">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 ${index < currentStepIndex ? 'bg-green-500' : 'bg-white/20'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {currentStep === 'offer' && renderOfferLetter()}
        {currentStep === 'bank' && renderBankStep()}
        {currentStep === 'card' && renderCardStep()}
      </div>
    </div>
  );
};

export default Onboarding;
