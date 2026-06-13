'use client';

import React, { useState } from 'react';

export default function ThermalAssumptionDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-xs font-semibold tracking-wider text-gray-400 hover:text-white uppercase transition focus:outline-none"
      >
        <span>Methodology References & Physical Assumptions</span>
        <svg
          className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 flex flex-col gap-4 text-xs border-t border-white/5 pt-4 text-gray-300 animate-fade-in font-sans">
          {/* Versioning & Citations section */}
          <div className="p-3.5 rounded-xl border border-white/5 bg-white/5 flex flex-col gap-2 font-mono text-[10px] text-gray-400">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-gray-500">Methodology Framework</span>
              <span className="text-white font-semibold">Viridimetrics Methodology v1.2</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-gray-500">FAO-56 Evapotranspiration Reference</span>
              <span className="text-white">Allen et al. (1998)</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-gray-500">ASHRAE Reference Guidelines</span>
              <span className="text-white">Chapter 18 (Heat Balance Method)</span>
            </div>
            <div className="flex justify-between pb-0.5">
              <span className="text-gray-500">Species Coefficient Dataset</span>
              <span className="text-emerald-400 font-semibold">v0.3</span>
            </div>
          </div>

          {/* Constants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Indoor Setpoint (Tin)</span>
                <span>22.0 °C</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Bare Envelope Resistance (R-wall)</span>
                <span>0.50 m²·K/W</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Psychrometric Constant (gamma)</span>
                <span>0.066 kPa/°C</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Latent Heat of Vaporization (lambda)</span>
                <span>2.45 MJ/kg</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Bare Facade Solar Absorptivity</span>
                <span>0.70</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Reference Wind Speed (u2)</span>
                <span>2.0 m/s</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Leaf Area Index (LAI) Baseline</span>
                <span>3.0</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Solar Net Conversion Factor</span>
                <span>0.70</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 leading-normal mt-1">
            * Methodology notes: Calculations assume steady-state thermodynamic equilibrium on vertical facade elements. Crop coefficients (Kc) and shading coefficients are calibrated to localized botanical species profiles.
          </div>
        </div>
      )}
    </div>
  );
}
