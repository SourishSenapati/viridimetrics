'use client';

import React, { useState } from 'react';

interface Species {
  key: string;
  scientific_name: string;
  common_name: string;
  transpiration_rate_coeff: number;
  shading_extinction_coeff: number;
  added_r_value: number;
}

interface BotanicalCatalogProps {
  speciesList: Species[];
}

export default function BotanicalCoefficientCatalog({ speciesList }: BotanicalCatalogProps) {
  const [selectedSpec, setSelectedSpec] = useState<Species | null>(null);

  return (
    <div className="w-full flex flex-col gap-5 p-6 rounded-2xl glass-panel text-white">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-emerald-400">Horticultural Parameter Index</h2>
        <p className="text-[11px] text-gray-400 mt-1">
          Reference catalog detailing how botanical traits map to thermodynamic properties.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {speciesList.map((spec) => (
          <button
            key={spec.key}
            onClick={() => setSelectedSpec(spec)}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between h-20 ${
              selectedSpec?.key === spec.key 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : 'border-white/5 bg-white/5 hover:border-white/10'
            }`}
          >
            <span className="font-semibold text-xs text-white truncate w-full">{spec.common_name}</span>
            <span className="text-[10px] text-gray-400 italic truncate w-full">{spec.scientific_name}</span>
          </button>
        ))}
      </div>

      {selectedSpec && (
        <div className="p-4 rounded-xl border border-white/5 bg-white/5 text-xs flex flex-col gap-3.5 animate-fade-in">
          <div className="flex justify-between items-baseline border-b border-white/5 pb-1">
            <span className="font-bold text-gray-300">{selectedSpec.common_name}</span>
            <span className="text-[10px] text-gray-400 italic">{selectedSpec.scientific_name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-400 font-semibold uppercase text-[9px]">Transpiration Factor (Kc)</span>
              <span className="font-mono text-emerald-400 text-sm mt-0.5">{selectedSpec.transpiration_rate_coeff.toFixed(2)}</span>
              <p className="text-[9px] text-gray-500 font-sans mt-1 leading-normal">
                Scales latent heat water mass dissipation based on stomatal resistance.
              </p>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-gray-400 font-semibold uppercase text-[9px]">Light Extinction (k_ext)</span>
              <span className="font-mono text-amber-400 text-sm mt-0.5">{selectedSpec.shading_extinction_coeff.toFixed(2)}</span>
              <p className="text-[9px] text-gray-500 font-sans mt-1 leading-normal">
                Beer-Lambert constant determining how much solar radiation is blocked from hitting the facade.
              </p>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-gray-400 font-semibold uppercase text-[9px]">Boundary R-Value</span>
              <span className="font-mono text-sky-400 text-sm mt-0.5">{selectedSpec.added_r_value.toFixed(2)} m²·K/W</span>
              <p className="text-[9px] text-gray-500 font-sans mt-1 leading-normal">
                Thermal insulation value provided by the substrate layer and foliage boundary airgap.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
