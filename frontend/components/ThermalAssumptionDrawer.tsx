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
        <span>ASHRAE Building Physics Assumptions</span>
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
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-t border-white/5 pt-4 text-gray-300 font-mono animate-fade-in">
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

          <div className="col-span-1 md:col-span-2 text-[10px] text-gray-500 leading-normal mt-1 font-sans">
            * References: ASHRAE Handbook of Fundamentals Chapter 18; FAO Irrigation and Drainage Paper 56 (FAO-56) Penman-Monteith methodology for dynamic evapotranspiration estimation.
          </div>
        </div>
      )}
    </div>
  );
}
