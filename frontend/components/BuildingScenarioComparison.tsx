'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Species {
  key: string;
  scientific_name: string;
  common_name: string;
}

interface ScenarioMetric {
  name: string;
  wall_area_m2: number;
  plant_type: string;
  cooling_offset_thermal_kwh: number;
  hvac_load_reduction_kwh: number;
  daily_savings_usd: number;
  water_transpiration_liters: number;
}

interface BuildingScenarioComparisonProps {
  speciesList: Species[];
  temperature: number;
  humidity: number;
  solarRadiation: number;
}

export default function BuildingScenarioComparison({
  speciesList,
  temperature,
  humidity,
  solarRadiation
}: BuildingScenarioComparisonProps) {
  // Scenario A States
  const [areaA, setAreaA] = useState(100);
  const [plantA, setPlantA] = useState('hedera_helix');
  
  // Scenario B States
  const [areaB, setAreaB] = useState(250);
  const [plantB, setPlantB] = useState('hedera_helix');

  const [metrics, setMetrics] = useState<ScenarioMetric[]>([]);
  const [deltaKwh, setDeltaKwh] = useState(0);
  const [deltaSavings, setDeltaSavings] = useState(0);
  const [optimalName, setOptimalName] = useState('');
  const [loading, setLoading] = useState(false);

  const triggerComparison = useCallback(async () => {
    setLoading(true);
    const payload = {
      temperature_c: temperature,
      humidity: humidity,
      solar_radiation: solarRadiation,
      scenarios: [
        {
          name: "Scenario A (Baseline)",
          wall_area_m2: areaA,
          plant_type: plantA,
          leaf_area_index: 3.0,
          chiller_cop: 3.0,
          electricity_rate: 0.15
        },
        {
          name: "Scenario B (Proposed)",
          wall_area_m2: areaB,
          plant_type: plantB,
          leaf_area_index: 3.0,
          chiller_cop: 3.0,
          electricity_rate: 0.15
        }
      ]
    };

    try {
      const res = await fetch('/api/scenarios/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.scenario_metrics);
        setDeltaKwh(data.delta_hvac_kwh);
        setDeltaSavings(data.delta_savings_usd);
        setOptimalName(data.optimal_scenario_name);
      }
    } catch (err) {
      console.error("Failed to compare scenarios on backend.");
    } finally {
      setLoading(false);
    }
  }, [temperature, humidity, solarRadiation, areaA, plantA, areaB, plantB]);

  useEffect(() => {
    triggerComparison();
  }, [triggerComparison]);

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-2xl glass-panel text-white">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-emerald-400">Simulation Scenarios Comparison</h2>
        <p className="text-[11px] text-gray-400 mt-1">
          Perform side-by-side design parameter comparisons to determine optimal capital yields.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-b border-white/5 pb-5">
        {/* Scenario A */}
        <div className="flex flex-col gap-4 p-4 rounded-xl border border-white/5 bg-white/5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Scenario A</h3>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Wall Area</span>
              <span className="font-mono text-white">{areaA} m²</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={areaA}
              onChange={(e) => setAreaA(Number(e.target.value))}
              className="apple-slider"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Vegetation Canopy</label>
            <select
              value={plantA}
              onChange={(e) => setPlantA(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
            >
              {speciesList.map((spec) => (
                <option key={spec.key} value={spec.key}>
                  {spec.common_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scenario B */}
        <div className="flex flex-col gap-4 p-4 rounded-xl border border-white/5 bg-white/5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Scenario B</h3>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Wall Area</span>
              <span className="font-mono text-white">{areaB} m²</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={areaB}
              onChange={(e) => setAreaB(Number(e.target.value))}
              className="apple-slider"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Vegetation Canopy</label>
            <select
              value={plantB}
              onChange={(e) => setPlantB(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
            >
              {speciesList.map((spec) => (
                <option key={spec.key} value={spec.key}>
                  {spec.common_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {metrics.length === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-xs">
            <div>
              <span className="text-gray-400 font-medium">Optimal Selection:</span>
              <strong className="text-white ml-1.5">{optimalName}</strong>
            </div>
            <div className="text-right">
              <span className="text-gray-400 font-medium">Delta Savings:</span>
              <strong className="text-emerald-400 ml-1.5">+${deltaSavings.toFixed(2)} / day</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {metrics.map((metric, i) => (
              <div key={i} className="flex flex-col gap-2 p-3.5 rounded-xl border border-white/5 bg-white/5">
                <span className="font-bold text-gray-300 border-b border-white/5 pb-1 font-sans">{metric.name}</span>
                <div className="flex justify-between">
                  <span className="text-gray-500">Facade Cooling</span>
                  <span>{metric.cooling_offset_thermal_kwh.toFixed(1)} kWh(t)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">HVAC Mitigated</span>
                  <span>{metric.hvac_load_reduction_kwh.toFixed(1)} kWh(e)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Water Transpired</span>
                  <span>{metric.water_transpiration_liters.toFixed(1)} L/day</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1 mt-1 font-bold">
                  <span className="text-gray-400 font-sans">Daily Yield</span>
                  <span className="text-emerald-400">${metric.daily_savings_usd.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
