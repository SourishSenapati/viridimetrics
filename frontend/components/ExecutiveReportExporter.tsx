'use client';

import React, { useState } from 'react';

interface ExecutiveReportExporterProps {
  wallArea: number;
  plantType: string;
  coolingKwh: number;
  electricityRate: number;
}

export default function ExecutiveReportExporter({
  wallArea,
  plantType,
  coolingKwh,
  electricityRate
}: ExecutiveReportExporterProps) {
  const [reportType, setReportType] = useState('ENGINEERING_VALIDATION_V1');
  const [loading, setLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState('');

  const handleCompile = async () => {
    setLoading(true);
    setReportHtml('');
    
    // Extrapolate daily parameters for annual reporting metrics
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
      initial_investment_usd: initialInvestment
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
          disabled={loading}
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
              className="text-emerald-400 hover:underline flex items-center gap-1 focus:outline-none"
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
