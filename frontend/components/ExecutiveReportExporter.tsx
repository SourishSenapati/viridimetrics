'use client';

import React, { useState } from 'react';

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

interface CalculateResult {
  cooling_kwh: number;
  cost_saved: number;
  co2_saved: number;
  details: CalculationDetails;
  
  baseline_heat_gain: number;
  vegetated_heat_gain: number;
  net_reduction: number;
  hvac_offset: number;
  
  confidence_range_low: number;
  confidence_range_high: number;
  
  package_id?: string;
  equation_version?: string;
  species_dataset_version?: string;
  financial_model_version?: string;
  weather_assumption_version?: string;
  generated_at?: string;

  facade_orientation?: string;
  regulatory_framework?: string;
  avoided_carbon_fine?: number;
  water_cost_usd?: number;
  is_premium_unlock?: number;
}

interface ExecutiveReportExporterProps {
  wallArea: number;
  plantType: string;
  coolingKwh: number;
  electricityRate: number;
  calcResult: CalculateResult | null;
  isPremiumUnlocked: boolean;
  onOpenPaymentTerminal: () => void;
}

export default function ExecutiveReportExporter({
  wallArea,
  plantType,
  coolingKwh,
  electricityRate,
  calcResult,
  isPremiumUnlocked,
  onOpenPaymentTerminal
}: ExecutiveReportExporterProps) {
  const [reportType, setReportType] = useState('ENGINEERING_VALIDATION_V1');
  const [loading, setLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState('');

  const handleCompile = async () => {
    if (!calcResult) return;
    
    setLoading(true);
    setReportHtml('');

    const annualSavings = coolingKwh * 365.0 * electricityRate;
    const annualCo2 = coolingKwh * 365.0 * 0.38;
    const initialInvestment = wallArea * 450.0;
    const payback = annualSavings > 0 ? initialInvestment / annualSavings : 99.0;

    const payload = {
      report_type: reportType,
      wall_area_m2: wallArea,
      plant_type: plantType,
      annual_savings_usd: annualSavings,
      annual_co2_reduction_kg: annualCo2,
      payback_years: payback,
      initial_investment_usd: initialInvestment,
      
      // Optional details
      package_id: calcResult.package_id || "VRM-2025-000000",
      expected_annual_savings_kwh: coolingKwh * 365.0,
      confidence_range_low_kwh: calcResult.confidence_range_low * 365.0,
      confidence_range_high_kwh: calcResult.confidence_range_high * 365.0,
      baseline_heat_gain_m2: calcResult.baseline_heat_gain,
      vegetated_heat_gain_m2: calcResult.vegetated_heat_gain,
      net_reduction_m2: calcResult.net_reduction,
      chiller_cop: calcResult.hvac_offset > 0 ? (calcResult.net_reduction / calcResult.hvac_offset) : 3.0,

      // Enhanced Pilot & Compliance metrics
      facade_orientation: calcResult.facade_orientation || "south",
      regulatory_framework: calcResult.regulatory_framework || "none",
      avoided_carbon_fine: calcResult.avoided_carbon_fine || 0.0,
      water_cost_usd: calcResult.water_cost_usd || 0.0,
      is_premium_unlock: isPremiumUnlocked ? 1 : 0
    };

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setReportHtml(data.formatted_html);
      }
    } catch (err) {
      console.error("Failed to compile executive performance report.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 p-6 rounded-2xl glass-panel text-white">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-emerald-400">Institutional Performance Reports</h2>
        <p className="text-[11px] text-gray-400 mt-1">
          Compile board-ready investment briefings, carbon disclosure audits, or operating savings summaries.
        </p>
      </div>

      {/* Premium Lock Callout */}
      {!isPremiumUnlocked && (
        <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-amber-400">PE-Stamped Report Lock</span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              Unlock the certified professional engineer signature stamp and irrigation audit tables.
            </span>
          </div>
          <button
            onClick={onOpenPaymentTerminal}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
          >
            Unlock PE Stamp ($499)
          </button>
        </div>
      )}

      {isPremiumUnlocked && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-emerald-400">Institutional PE License Unlocked</span>
            <span className="text-[10px] text-gray-400 mt-0.5">
              Methodology reports will be generated with a digital Professional Engineer stamp.
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
          >
            <option value="ENGINEERING_VALIDATION_V1">Engineering Validation Report v1 (PE-Grade Briefing)</option>
            <option value="ESG_BOARD">ESG Board Declaration Briefing</option>
            <option value="ENERGY_SAVINGS">Energy Savings Summary (CBRE Standard)</option>
            <option value="CARBON_OFFSET">Carbon Emissions Disclosure (JLL Compliant)</option>
            <option value="CAPITAL_JUSTIFICATION">Capital Investment Justification</option>
          </select>
        </div>

        <button
          onClick={handleCompile}
          disabled={loading || !calcResult}
          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-zinc-800 font-semibold px-6 py-3 rounded-xl text-xs text-black tracking-wider uppercase transition cursor-pointer"
        >
          {loading ? "Compiling..." : "Generate Brief"}
        </button>
      </div>

      {reportHtml && (
        <div className="flex flex-col gap-3.5 p-4 rounded-xl border border-white/5 bg-white/5 animate-fade-in">
          <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
            <span className="text-gray-300 font-semibold">Report Brief Compiled</span>
            <button
              onClick={handlePrint}
              className="text-emerald-400 hover:underline flex items-center gap-1 focus:outline-none cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Briefing</span>
            </button>
          </div>

          <div className="max-h-[220px] overflow-y-auto bg-white/5 p-4 rounded-lg border border-white/5">
            <div className="text-[10px] text-gray-400 leading-relaxed font-mono whitespace-pre-wrap select-all">
              {reportHtml}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
