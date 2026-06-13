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

interface ResultCardProps {
  coolingKwh: number;
  details: CalculationDetails | null;
  loading: boolean;
}

export default function ResultCard({ coolingKwh, details, loading }: ResultCardProps) {
  if (loading) {
    return (
      <div className="w-full flex flex-col justify-center items-center h-[350px] p-6 rounded-3xl glass-panel-glow text-white relative overflow-hidden">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="rounded-full bg-emerald-500/20 h-12 w-12 flex items-center justify-center">
            <div className="rounded-full bg-emerald-500 h-6 w-6 animate-ping" />
          </div>
          <span className="text-sm text-gray-400">Computing thermal parameters...</span>
        </div>
      </div>
    );
  }

  // Calculate fractions for visual representation
  const latent = details?.latent_cooling_kwh || 0;
  const shading = details?.shading_savings_kwh || 0;
  const insulation = details?.insulation_savings_kwh || 0;
  const total = latent + shading + insulation;

  const latentPercent = total > 0 ? (latent / total) * 100 : 0;
  const shadingPercent = total > 0 ? (shading / total) * 100 : 0;
  const insulationPercent = total > 0 ? (insulation / total) * 100 : 0;

  return (
    <div className="w-full flex flex-col justify-between p-8 rounded-3xl glass-panel-glow text-white relative overflow-hidden border border-white/20 min-h-[350px]">
      {/* Background Liquid Glass Blob Glow */}
      <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-emerald-500/20 blur-[80px] pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-sky-500/10 blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="z-10 flex flex-col">
        <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Today's Performance</span>
        <h3 className="text-lg text-gray-300 font-medium mt-1">Cooling Energy Generated</h3>
      </div>

      {/* Big Number */}
      <div className="z-10 my-6 flex items-baseline gap-2">
        <span className="text-7xl font-extrabold tracking-tight text-white drop-shadow-sm font-sans">
          {coolingKwh.toFixed(1)}
        </span>
        <span className="text-xl text-emerald-400 font-medium">kWh/day</span>
      </div>

      {/* Thermodynamic Breakdown Stack (Explainable calculations) */}
      <div className="z-10 flex flex-col gap-3.5 pt-4 border-t border-white/10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Calculation Engine Breakdown</span>
          <span className="text-emerald-400 font-semibold font-mono">{(total / (details?.latent_cooling_kwh ? 1 : 1)).toFixed(1)} kWh (thermal)</span>
        </div>

        {/* Breakdown bar */}
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-white/10">
          <div style={{ width: `${latentPercent}%` }} className="bg-emerald-400 h-full transition-all duration-500" title="Evapotranspiration" />
          <div style={{ width: `${shadingPercent}%` }} className="bg-amber-400 h-full transition-all duration-500" title="Solar Shading" />
          <div style={{ width: `${insulationPercent}%` }} className="bg-sky-400 h-full transition-all duration-500" title="Wall Insulation" />
        </div>

        {/* Legend & values */}
        <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 font-medium text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Evaporation</span>
            </div>
            <span className="font-mono pl-3">{latent.toFixed(1)} kWh ({latentPercent.toFixed(0)}%)</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 font-medium text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Solar Shading</span>
            </div>
            <span className="font-mono pl-3">{shading.toFixed(1)} kWh ({shadingPercent.toFixed(0)}%)</span>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 font-medium text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Insulation</span>
            </div>
            <span className="font-mono pl-3">{insulation.toFixed(1)} kWh ({insulationPercent.toFixed(0)}%)</span>
          </div>
        </div>

        {/* Water Transpired Metric */}
        {details && (
          <div className="flex justify-between items-center text-[11px] bg-white/5 rounded-lg p-2.5 mt-2 border border-white/5">
            <span className="text-gray-400">Transpiration Water Lost</span>
            <span className="font-mono text-sky-400 font-semibold">{details.water_transpired_liters.toFixed(1)} Liters/day</span>
          </div>
        )}
      </div>
    </div>
  );
}
