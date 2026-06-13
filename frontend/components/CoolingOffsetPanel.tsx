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
}

interface CoolingOffsetPanelProps {
  calcResult: CalculateResult | null;
  loading: boolean;
}

export default function CoolingOffsetPanel({ calcResult, loading }: CoolingOffsetPanelProps) {
  if (loading) {
    return (
      <div className="w-full flex flex-col justify-center items-center h-[460px] rounded-3xl glass-panel text-white">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="rounded-full bg-emerald-500/20 h-10 w-10 flex items-center justify-center">
            <div className="rounded-full bg-emerald-500 h-5 w-5 animate-ping" />
          </div>
          <span className="text-xs text-gray-400">Computing thermal physics...</span>
        </div>
      </div>
    );
  }

  if (!calcResult) {
    return (
      <div className="w-full flex flex-col justify-center items-center h-[460px] rounded-3xl glass-panel text-white text-gray-500 text-xs">
        No calculation data. Update inputs to compute.
      </div>
    );
  }

  const {
    cooling_kwh,
    details,
    baseline_heat_gain,
    vegetated_heat_gain,
    net_reduction,
    hvac_offset,
    confidence_range_low,
    confidence_range_high,
    package_id = "VRM-2025-000000",
    equation_version = "v1.2",
    species_dataset_version = "v0.3",
    financial_model_version = "v1.0",
    weather_assumption_version = "v1.0"
  } = calcResult;

  const latent = details?.latent_cooling_kwh || 0;
  const shading = details?.shading_savings_kwh || 0;
  const insulation = details?.insulation_savings_kwh || 0;
  const total = latent + shading + insulation;

  const latentPercent = total > 0 ? (latent / total) * 100 : 0;
  const shadingPercent = total > 0 ? (shading / total) * 100 : 0;
  const insulationPercent = total > 0 ? (insulation / total) * 100 : 0;

  // Annualized values
  const annualExpected = cooling_kwh * 365.0;
  const annualLow = confidence_range_low * 365.0;
  const annualHigh = confidence_range_high * 365.0;

  return (
    <div className="w-full flex flex-col justify-between p-8 rounded-3xl glass-panel text-white relative overflow-hidden min-h-[460px] gap-6">
      <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Header and Provenance Info */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-wider text-emerald-400 font-bold uppercase">HVAC Cooling Offset</span>
          <h3 className="text-base text-gray-300 font-semibold mt-0.5">Calculated Facade Mitigation</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[9px] uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold tracking-wider">
            ID: {package_id}
          </span>
          <span className="text-[8px] text-gray-500 font-mono">
            Methodology: {equation_version} | Species: {species_dataset_version}
          </span>
        </div>
      </div>

      {/* Main Results and Error Bands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Expected Savings */}
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Expected Savings</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-5xl font-extrabold tracking-tight text-white">{cooling_kwh.toFixed(1)}</span>
            <span className="text-sm text-emerald-400 font-medium">kWh / day</span>
          </div>
          <span className="text-xs text-gray-500 font-mono mt-1">
            ({annualExpected.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh / year expected)
          </span>
        </div>

        {/* Confidence Range Card */}
        <div className="p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-1">
            92.5% PE Confidence Range
          </span>
          <div className="flex items-baseline gap-1 mt-1 font-mono">
            <span className="text-lg font-bold text-gray-200">{confidence_range_low.toFixed(1)}</span>
            <span className="text-xs text-gray-500">–</span>
            <span className="text-lg font-bold text-gray-200">{confidence_range_high.toFixed(1)}</span>
            <span className="text-xs text-gray-400 ml-1.5">kWh / day</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-mono">
            Annual: {annualLow.toLocaleString(undefined, { maximumFractionDigits: 0 })} – {annualHigh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
          </div>
        </div>
      </div>

      {/* Baseline vs Vegetated Comparison Table */}
      <div className="flex flex-col gap-2 p-4 rounded-2xl border border-white/5 bg-white/5">
        <h4 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Facade Heat Balance (kWh thermal / day)</h4>
        
        <div className="grid grid-cols-3 gap-2 text-xs border-b border-white/5 pb-1.5 font-mono text-gray-400 font-semibold mt-1">
          <span>Scenario</span>
          <span className="text-right">Heat Gain</span>
          <span className="text-right">Net Load</span>
        </div>

        <div className="flex flex-col gap-1.5 text-xs font-mono">
          <div className="grid grid-cols-3 gap-2 py-0.5 text-gray-300">
            <span className="text-gray-400">Baseline Facade</span>
            <span className="text-right text-amber-400">+{baseline_heat_gain.toFixed(1)}</span>
            <span className="text-right">+{baseline_heat_gain.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 py-0.5 text-gray-300">
            <span className="text-gray-400">Vegetated Facade</span>
            <span className="text-right text-emerald-400">+{vegetated_heat_gain.toFixed(1)}</span>
            <span className="text-right">+{vegetated_heat_gain.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-white/5 text-white font-bold">
            <span className="font-sans text-emerald-400">Thermal Mitigation</span>
            <span className="text-right text-emerald-400">-{net_reduction.toFixed(1)}</span>
            <span className="text-right font-sans font-bold text-emerald-400">{net_reduction.toFixed(1)} kWh(t)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-[10px] text-gray-500">
            <span className="col-span-3 text-right">
              HVAC Chiller Offset (COP): <strong className="text-gray-300 font-mono font-medium">{hvac_offset.toFixed(1)} kWh(e)/day</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown detail */}
      <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Thermodynamic Components</span>
          <span className="text-emerald-400 font-mono font-semibold">{total.toFixed(1)} kWh (thermal)</span>
        </div>

        {/* Stacked bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-white/10">
          <div style={{ width: `${latentPercent}%` }} className="bg-emerald-400 h-full transition-all duration-500" />
          <div style={{ width: `${shadingPercent}%` }} className="bg-amber-400 h-full transition-all duration-500" />
          <div style={{ width: `${insulationPercent}%` }} className="bg-sky-400 h-full transition-all duration-500" />
        </div>

        <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400">
          <div className="flex flex-col">
            <span className="text-gray-300 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Evapotranspiration
            </span>
            <span className="font-mono mt-0.5">{latent.toFixed(1)} kWh ({latentPercent.toFixed(0)}%)</span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-300 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Shading Effect
            </span>
            <span className="font-mono mt-0.5">{shading.toFixed(1)} kWh ({shadingPercent.toFixed(0)}%)</span>
          </div>

          <div className="flex flex-col">
            <span className="text-gray-300 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Insulation Buffer
            </span>
            <span className="font-mono mt-0.5">{insulation.toFixed(1)} kWh ({insulationPercent.toFixed(0)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
