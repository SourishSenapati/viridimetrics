'use client';

import React, { useState } from 'react';

interface Species {
  key: string;
  scientific_name: string;
  common_name: string;
}

interface InputPanelProps {
  wallArea: number;
  setWallArea: (val: number) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  humidity: number;
  setHumidity: (val: number) => void;
  solarRadiation: number;
  setSolarRadiation: (val: number) => void;
  plantType: string;
  setPlantType: (val: string) => void;
  speciesList: Species[];
  cop: number;
  setCop: (val: number) => void;
  electricityRate: number;
  setElectricityRate: (val: number) => void;
}

export default function InputPanel({
  wallArea,
  setWallArea,
  temperature,
  setTemperature,
  humidity,
  setHumidity,
  solarRadiation,
  setSolarRadiation,
  plantType,
  setPlantType,
  speciesList,
  cop,
  setCop,
  electricityRate,
  setElectricityRate
}: InputPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-2xl glass-panel text-white">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-emerald-400">Environmental Parameters</h2>
        <p className="text-xs text-gray-400 mt-1">Adjust the sliders to simulate real-time performance.</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Wall Area */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300 font-medium">Wall Area</span>
            <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{wallArea} m²</span>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={wallArea}
            onChange={(e) => setWallArea(Number(e.target.value))}
            className="apple-slider"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>10 m²</span>
            <span>500 m²</span>
            <span>1,000 m²</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300 font-medium">Ambient Temperature</span>
            <span className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded text-xs">{temperature} °C</span>
          </div>
          <input
            type="range"
            min="10"
            max="45"
            step="0.5"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="apple-slider"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>10 °C</span>
            <span>28 °C</span>
            <span>45 °C</span>
          </div>
        </div>

        {/* Relative Humidity */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300 font-medium">Relative Humidity</span>
            <span className="font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-xs">{humidity} %</span>
          </div>
          <input
            type="range"
            min="10"
            max="95"
            step="1"
            value={humidity}
            onChange={(e) => setHumidity(Number(e.target.value))}
            className="apple-slider"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>10% (Arid)</span>
            <span>50%</span>
            <span>95% (Tropical)</span>
          </div>
        </div>

        {/* Solar Radiation */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300 font-medium">Solar Radiation</span>
            <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-xs">{solarRadiation} W/m²</span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            step="20"
            value={solarRadiation}
            onChange={(e) => setSolarRadiation(Number(e.target.value))}
            className="apple-slider"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>0 W/m² (Night)</span>
            <span>500 W/m² (Cloudy)</span>
            <span>1,000 W/m² (Direct Sun)</span>
          </div>
        </div>

        {/* Plant Type Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Vegetation Canopy Species</label>
          <div className="relative">
            <select
              value={plantType}
              onChange={(e) => setPlantType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none transition"
            >
              {speciesList.map((spec) => (
                <option key={spec.key} value={spec.key} className="bg-zinc-950 text-white">
                  {spec.common_name} ({spec.scientific_name})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="border-t border-white/5 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-white transition focus:outline-none"
        >
          <span className="font-semibold tracking-wider uppercase">Engineering System Settings</span>
          <svg
            className={`w-4 h-4 transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-4 mt-4 animate-fade-in">
            {/* COP */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Chiller COP (Cooling Efficiency)</span>
                <span className="font-mono text-white">{cop}</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="5.0"
                step="0.1"
                value={cop}
                onChange={(e) => setCop(Number(e.target.value))}
                className="apple-slider"
              />
              <span className="text-[9px] text-gray-500">Typical ASHRAE baseline: 2.5 to 3.5</span>
            </div>

            {/* Electricity Rate */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Electricity Utility Cost ($/kWh)</span>
                <span className="font-mono text-white">${electricityRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.45"
                step="0.01"
                value={electricityRate}
                onChange={(e) => setElectricityRate(Number(e.target.value))}
                className="apple-slider"
              />
              <span className="text-[9px] text-gray-500">Commercial average: $0.12 - $0.20</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
