import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { useUserStore } from '../stores/useUserStore';
import { SubscriptionTier } from '../types';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  icon: React.ReactNode;
  features: PlanFeature[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: <Star className="w-6 h-6" />,
    features: [
      { text: 'Read Bible offline', included: true },
      { text: 'Join church community', included: true },
      { text: 'View announcements & events', included: true },
      { text: 'Submit prayer requests', included: true },
      { text: 'Record sermons', included: false },
      { text: 'AI sermon summaries', included: false },
      { text: 'Personal notes & highlights', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$4.99',
    period: '/month',
    icon: <Zap className="w-6 h-6" />,
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Record sermons (5/month)', included: true },
      { text: 'Basic AI summaries', included: true },
      { text: 'Personal notes', included: true },
      { text: 'Unlimited recordings', included: false },
      { text: 'Advanced AI features', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    icon: <Crown className="w-6 h-6" />,
    popular: true,
    features: [
      { text: 'Everything in Basic', included: true },
      { text: 'Unlimited sermon recordings', included: true },
      { text: 'Advanced AI summaries & insights', included: true },
      { text: 'Export notes & transcripts', included: true },
      { text: 'Cloud backup & sync', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to features', included: true },
    ],
  },
];

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { subscriptionTier, setSubscription } = useUserStore();
  
  const handleSelectPlan = (planId: SubscriptionTier) => {
    Haptics.impact({ style: ImpactStyle.Medium });
    
    // In a real app, this would trigger payment flow
    if (planId === 'free') {
      setSubscription(planId);
      navigate(-1);
    } else {
      // Simulate subscription (in real app, integrate payment)
      if (confirm(`Subscribe to ${planId} plan? (Demo - no actual payment)`)) {
        setSubscription(planId);
        navigate(-1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => {
            Haptics.impact({ style: ImpactStyle.Light });
            navigate(-1);
          }}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1">Subscription</h1>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Current Plan Banner */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-4 text-white">
          <p className="text-sm opacity-80">Current Plan</p>
          <p className="text-xl font-bold capitalize">{subscriptionTier}</p>
        </div>
        
        {/* Plans */}
        <div className="space-y-4">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-white dark:bg-card-dark rounded-2xl p-5 border-2 transition-all ${
                subscriptionTier === plan.id 
                  ? 'border-primary shadow-lg shadow-primary/20' 
                  : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                  Most Popular
                </span>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  plan.id === 'premium' 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                    : plan.id === 'basic'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-500">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                    {plan.period}
                  </p>
                </div>
              </div>
              
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className={`flex items-center gap-2 text-sm ${
                    feature.included 
                      ? 'text-slate-700 dark:text-slate-300' 
                      : 'text-slate-400 line-through'
                  }`}>
                    <Check className={`w-4 h-4 ${
                      feature.included ? 'text-green-500' : 'text-gray-300'
                    }`} />
                    {feature.text}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => handleSelectPlan(plan.id)}
                disabled={subscriptionTier === plan.id}
                className={`w-full py-3 font-bold rounded-xl transition-all active:scale-[0.98] ${
                  subscriptionTier === plan.id
                    ? 'bg-gray-100 dark:bg-slate-800 text-slate-400 cursor-default'
                    : plan.popular
                    ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                {subscriptionTier === plan.id ? 'Current Plan' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
        
        {/* Note */}
        <p className="text-xs text-slate-400 text-center px-4">
          Cancel anytime. Subscriptions help us maintain and improve BibleNoteLM.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
