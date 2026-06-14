'use client';

import React, { useState } from 'react';

interface PaymentTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (unlockedFramework: string) => void;
}

export default function PaymentTerminal({ isOpen, onClose, onPaymentSuccess }: PaymentTerminalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'single' | 'portfolio' | 'enterprise'>('single');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const getPlanDetails = () => {
    switch (selectedPlan) {
      case 'single':
        return { name: "Single Audit PE Stamp", price: "$499", desc: "PE calculations review, water cost loops, compliance carbon penalty auditing." };
      case 'portfolio':
        return { name: "Portfolio SaaS Subscription", price: "$250 / mo", desc: "Dynamic TMY3 GIS mapping, automated Local Law penalties across all tower assets." };
      case 'enterprise':
        return { name: "Enterprise PE Stamp Audit", price: "$1,200 / mo", desc: "Instant automated Professional Engineer stamped validation, submetered HVAC loops." };
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    const matches = value.match(/.{1,4}/g);
    if (matches) {
      setCardNumber(matches.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 4);
    if (value.length > 2) {
      setCardExpiry(value.substring(0, 2) + '/' + value.substring(2));
    } else {
      setCardExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardCvv(value.substring(0, 3));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Basic validation
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setErrorMsg('Invalid Credit Card Number (16 digits required)');
      return;
    }
    if (cardExpiry.length !== 5) {
      setErrorMsg('Invalid Expiry Date (MM/YY required)');
      return;
    }
    if (cardCvv.length !== 3) {
      setErrorMsg('Invalid CVV (3 digits required)');
      return;
    }
    if (!cardName.trim()) {
      setErrorMsg('Cardholder name required');
      return;
    }

    setProcessing(true);

    // Simulate payment processor logic
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess(selectedPlan);
        setSuccess(false);
        onClose();
      }, 1500);
    }, 2000);
  };

  const currentPlan = getPlanDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-zinc-900/90 p-8 text-white relative shadow-2xl overflow-hidden glass-panel-glow">
        
        {/* Glow circle */}
        <div className="absolute -right-24 -top-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[70px] pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition focus:outline-none cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 mb-6">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Payment Authorized</h3>
            <p className="text-sm text-gray-400 mt-2">Unlocking premium compliance analytics ledger...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span className="text-emerald-400">Viridimetrics</span> Payment Terminal
              </h2>
              <p className="text-xs text-gray-400 mt-1">Unlock professional audit features and carbon penalty compliance models.</p>
            </div>

            {/* Plan selector */}
            <div className="grid grid-cols-3 gap-3">
              {(['single', 'portfolio', 'enterprise'] as const).map((plan) => {
                const planName = plan === 'single' ? 'Audit' : plan === 'portfolio' ? 'SaaS' : 'Enterprise';
                const planPrice = plan === 'single' ? '$499' : plan === 'portfolio' ? '$250/mo' : '$1,200/mo';
                const isSelected = selectedPlan === plan;
                return (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`p-3 rounded-xl border transition flex flex-col items-center justify-center gap-1 cursor-pointer focus:outline-none ${
                      isSelected 
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-white' 
                        : 'border-white/5 bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-semibold">{planName}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{planPrice}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-[11px] leading-relaxed text-gray-400">
              <span className="text-white font-semibold block">{currentPlan.name} • {currentPlan.price}</span>
              {currentPlan.desc}
            </div>

            {/* Credit Card Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <div className="absolute right-3.5 inset-y-0 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">CVV Code</label>
                  <input
                    type="password"
                    required
                    placeholder="•••"
                    value={cardCvv}
                    onChange={handleCvvChange}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {errorMsg && (
                <span className="text-[10px] text-rose-400 font-semibold mt-1">
                  {errorMsg}
                </span>
              )}

              <button
                type="submit"
                disabled={processing}
                className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-zinc-800 text-black font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer mt-2 text-center"
              >
                {processing ? "Processing Checkout..." : `Pay ${currentPlan.price} and Unlock`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
