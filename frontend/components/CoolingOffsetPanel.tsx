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

interface CoolingOffsetPanelProps {
  coolingKwh: number;
  details: CalculationDetails | null;
  loading: boolean;
}

export default function CoolingOffsetPanel({ coolingKwh, details, loading }: CoolingOffsetPanelProps) {
  if (loading) {
    return (
      <div className="w-full flex flex-col justify-center items-center h-[340px] rounded-3xl glass-panel text-white">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="rounded-full bg-emerald-500/20 h-10 w-10 flex items-center justify-center">
            <div className="rounded-full bg-emerald-500 h-5 w-5 animate-ping" />
          </div>
          <span className="text-xs text-gray-400">Computing thermal physics...</span>
        </div>
      </div>
    );
  }

  const latent = details?.latent_cooling_kwh || 0;
  const shading = details?.shading_savings_kwh || 0;
  const insulation = details?.insulation_savings_kwh || 0;
  const total = latent + shading + insulation;

  const latentPercent = total > 0 ? (latent / total) * 100 : 0;
  const shadingPercent = total > 0 ? (shading / total) * 100 : 0;
  const insulationPercent = total > 0 ? (insulation / total) * 100 : 0;

  return (
    <div className="w-full flex flex-col justify-between p-8 rounded-3xl glass-panel text-white relative overflow-hidden min-h-[340px]">
      <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex flex-col">
        <span className="text-[10px] tracking-wider text-emerald-400 font-bold uppercase">HVAC Cooling Offset</span>
        <h3 className="text-base text-gray-300 font-semibold mt-0.5">Calculated Facade Mitigation</h3>
      </div>

      <div className="my-6">
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-extrabold tracking-tight">{coolingKwh.toFixed(1)}</span>
          <span className="text-lg text-emerald-400 font-medium">kWh/day</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          Estimated electrical load offset based on ASHRAE-style heat balances.
        </p>
      </div>

      <div className="flex flex-col gap-3.5 pt-4 border-t border-white/5">
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

        {/* Breakdown detail */}
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
