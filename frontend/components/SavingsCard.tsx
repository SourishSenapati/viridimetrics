'use client';

import React from 'react';

interface CalculationDetails {
  water_transpired_liters: number;
  latent_cooling_kwh: number;
  shading_savings_kwh: number;
  insulation_savings_kwh: number;
  daily_savings_usd: number;
  monthly_savings_usd: number;
  annual_savings_usd: number;
  annual_co2_reduction_kg: number;
}

interface SavingsCardProps {
  coolingKwh: number;
  details: CalculationDetails | null;
  loading: boolean;
}

export default function SavingsCard({ coolingKwh, details, loading }: SavingsCardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white/5 rounded-2xl h-36 border border-white/5" />
        ))}
      </div>
    );
  }

  const dailySavings = details?.daily_savings_usd || 0;
  const monthlySavings = details?.monthly_savings_usd || 0;
  const annualSavings = details?.annual_savings_usd || 0;
  const co2Avoided = details?.annual_co2_reduction_kg || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
      {/* 1. Energy Saved Card */}
      <div className="p-6 rounded-2xl glass-panel text-white border border-white/5 flex flex-col justify-between h-36 hover:border-emerald-500/30 transition duration-300">
        <div className="flex items-center justify-between text-xs text-gray-400 font-medium tracking-wide uppercase">
          <span>Daily Energy Saved</span>
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex flex-col mt-2">
          <span className="text-3xl font-bold font-sans">
            {coolingKwh.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400 mt-1">Electrical kWh mitigated</span>
        </div>
      </div>

      {/* 2. Cost Saved Card */}
      <div className="p-6 rounded-2xl glass-panel text-white border border-white/5 flex flex-col justify-between h-36 hover:border-emerald-500/30 transition duration-300">
        <div className="flex items-center justify-between text-xs text-gray-400 font-medium tracking-wide uppercase">
          <span>Utility Yield Offset</span>
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex flex-col mt-2">
          <span className="text-3xl font-bold font-sans text-amber-400">
            ${dailySavings.toFixed(2)}
          </span>
          <div className="flex gap-3 text-[10px] text-gray-400 mt-1">
            <span>Mo: <strong className="text-white">${monthlySavings.toFixed(0)}</strong></span>
            <span>Yr: <strong className="text-white">${annualSavings.toFixed(0)}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Carbon Avoided Card */}
      <div className="p-6 rounded-2xl glass-panel text-white border border-white/5 flex flex-col justify-between h-36 hover:border-emerald-500/30 transition duration-300">
        <div className="flex items-center justify-between text-xs text-gray-400 font-medium tracking-wide uppercase">
          <span>Carbon Avoided</span>
          <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <div className="flex flex-col mt-2">
          <span className="text-3xl font-bold font-sans text-sky-400">
            {co2Avoided.toFixed(0)} <span className="text-xs font-normal text-gray-400">kg/yr</span>
          </span>
          <span className="text-xs text-gray-400 mt-1">CO₂ emissions mitigated</span>
        </div>
      </div>
    </div>
  );
}
