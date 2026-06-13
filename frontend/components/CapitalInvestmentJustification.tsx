'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface CapitalInvestmentJustificationProps {
  wallArea: number;
  coolingKwh: number;
  electricityRate: number;
}

interface FinancialMetrics {
  initial_capital_expense_usd: number;
  annual_operating_expense_usd: number;
  annual_utility_savings_usd: number;
  net_annual_cash_flow_usd: number;
  simple_payback_years: number;
  net_present_value_usd: number;
  internal_rate_of_return_percent: number | null;
}

export default function CapitalInvestmentJustification({
  wallArea,
  coolingKwh,
  electricityRate
}: CapitalInvestmentJustificationProps) {
  // CapEx baseline: $450/m² installation, OpEx: $25/m² maintenance
  const [installCostPerM2, setInstallCostPerM2] = useState(450);
  const [maintCostPerM2, setMaintCostPerM2] = useState(25);
  const [discountRate, setDiscountRate] = useState(8.0);
  const [lifetimeYears, setLifetimeYears] = useState(15);

  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateROI = useCallback(async () => {
    setLoading(true);
    const payload = {
      installation_cost_usd_per_m2: installCostPerM2,
      annual_maintenance_usd_per_m2: maintCostPerM2,
      wall_area_m2: wallArea,
      daily_electricity_savings_kwh: coolingKwh,
      electricity_rate_usd_kwh: electricityRate,
      discount_rate_percent: discountRate,
      project_lifetime_years: lifetimeYears
    };

    try {
      const res = await fetch('/api/financial/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to run financial analyzer.");
    } finally {
      setLoading(false);
    }
  }, [installCostPerM2, maintCostPerM2, wallArea, coolingKwh, electricityRate, discountRate, lifetimeYears]);

  useEffect(() => {
    calculateROI();
  }, [calculateROI]);

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-2xl glass-panel text-white">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-emerald-400">Capital Investment & ROI Analyzer</h2>
        <p className="text-[11px] text-gray-400 mt-1">
          Evaluate project cash flows, Net Present Value (NPV), and Internal Rate of Return (IRR).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-white/5 pb-5">
        {/* Cost Settings */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Installation Cost ($/m²)</span>
              <span className="font-mono">${installCostPerM2}</span>
            </div>
            <input
              type="range"
              min="150"
              max="800"
              step="25"
              value={installCostPerM2}
              onChange={(e) => setInstallCostPerM2(Number(e.target.value))}
              className="apple-slider"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Annual Maintenance ($/m²)</span>
              <span className="font-mono">${maintCostPerM2}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={maintCostPerM2}
              onChange={(e) => setMaintCostPerM2(Number(e.target.value))}
              className="apple-slider"
            />
          </div>
        </div>

        {/* Investment parameters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Discount Rate (WACC)</span>
              <span className="font-mono">{discountRate}%</span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              step="0.5"
              value={discountRate}
              onChange={(e) => setDiscountRate(Number(e.target.value))}
              className="apple-slider"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Asset Operating Horizon</span>
              <span className="font-mono">{lifetimeYears} years</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={lifetimeYears}
              onChange={(e) => setLifetimeYears(Number(e.target.value))}
              className="apple-slider"
            />
          </div>
        </div>
      </div>

      {metrics && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CapEx Total */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Initial CapEx</span>
            <span className="text-xl font-bold font-sans mt-2">${metrics.initial_capital_expense_usd.toLocaleString()}</span>
          </div>

          {/* Payback */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Simple Payback</span>
            <span className="text-xl font-bold font-sans mt-2 text-amber-400">
              {metrics.simple_payback_years > 50 ? "Infinite" : `${metrics.simple_payback_years.toFixed(1)} Yrs`}
            </span>
          </div>

          {/* NPV */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Net Present Value (NPV)</span>
            <span className={`text-xl font-bold font-sans mt-2 ${metrics.net_present_value_usd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${metrics.net_present_value_usd.toLocaleString()}
            </span>
          </div>

          {/* IRR */}
          <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">IRR (Annual Yield)</span>
            <span className="text-xl font-bold font-sans mt-2 text-sky-400">
              {metrics.internal_rate_of_return_percent !== null 
                ? `${metrics.internal_rate_of_return_percent.toFixed(1)}%` 
                : 'Negative'}
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
