'use client';

import React, { useState, useEffect, useCallback } from 'react';
import InputPanel from '../components/InputPanel';
import CoolingOffsetPanel from '../components/CoolingOffsetPanel';
import ThermalAssumptionDrawer from '../components/ThermalAssumptionDrawer';
import BotanicalCoefficientCatalog from '../components/BotanicalCoefficientCatalog';
import BuildingScenarioComparison from '../components/BuildingScenarioComparison';
import CapitalInvestmentJustification from '../components/CapitalInvestmentJustification';
import UtilityAuditLogImporter from '../components/UtilityAuditLogImporter';
import ExecutiveReportExporter from '../components/ExecutiveReportExporter';

interface Species {
  key: string;
  scientific_name: string;
  common_name: string;
  transpiration_rate_coeff: number;
  shading_extinction_coeff: number;
  added_r_value: number;
}

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

interface HistoryItem {
  id: number;
  wall_area_m2: number;
  plant_type: string;
  temperature_c: number;
  humidity: number;
  solar_radiation: number;
  cooling_kwh: number;
  cost_saved: number;
  co2_saved: number;
  
  baseline_heat_gain?: number;
  vegetated_heat_gain?: number;
  net_reduction?: number;
  hvac_offset?: number;
  
  package_id?: string;
  equation_version?: string;
  species_dataset_version?: string;
  financial_model_version?: string;
  weather_assumption_version?: string;
  
  created_at: string;
}

const FALLBACK_SPECIES: Species[] = [
  {
    key: "hedera_helix",
    scientific_name: "Hedera helix",
    common_name: "Common Ivy",
    transpiration_rate_coeff: 0.8,
    shading_extinction_coeff: 0.6,
    added_r_value: 0.45
  },
  {
    key: "ficus_religiosa",
    scientific_name: "Ficus religiosa",
    common_name: "Sacred Fig / Peepal",
    transpiration_rate_coeff: 1.2,
    shading_extinction_coeff: 0.7,
    added_r_value: 0.50
  },
  {
    key: "alstonia_scholaris",
    scientific_name: "Alstonia scholaris",
    common_name: "Devil Tree",
    transpiration_rate_coeff: 0.9,
    shading_extinction_coeff: 0.65,
    added_r_value: 0.45
  },
  {
    key: "pinus_sylvestris",
    scientific_name: "Pinus sylvestris",
    common_name: "Scots Pine",
    transpiration_rate_coeff: 0.5,
    shading_extinction_coeff: 0.5,
    added_r_value: 0.40
  },
  {
    key: "betula_pendula",
    scientific_name: "Betula pendula",
    common_name: "Silver Birch",
    transpiration_rate_coeff: 1.0,
    shading_extinction_coeff: 0.6,
    added_r_value: 0.45
  }
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'simulation' | 'reports'>('calculator');
  const [speciesList, setSpeciesList] = useState<Species[]>(FALLBACK_SPECIES);
  
  // Simulation Inputs
  const [wallArea, setWallArea] = useState(150);
  const [temperature, setTemperature] = useState(30);
  const [humidity, setHumidity] = useState(50);
  const [solarRadiation, setSolarRadiation] = useState(600);
  const [plantType, setPlantType] = useState('hedera_helix');
  const [cop, setCop] = useState(3.0);
  const [electricityRate, setElectricityRate] = useState(0.15);

  // Simulation Outputs
  const [coolingKwh, setCoolingKwh] = useState(0);
  const [details, setDetails] = useState<CalculationDetails | null>(null);
  const [calcResult, setCalcResult] = useState<CalculateResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Fetch species
  const loadSpecies = useCallback(async () => {
    try {
      const res = await fetch('/api/species');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setSpeciesList(data);
          setIsOfflineMode(false);
        }
      }
    } catch (err) {
      console.warn("FastAPI offline. Falling back to local JS calculations.");
      setIsOfflineMode(true);
    }
  }, []);

  // Fetch history list
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      // Ignore if offline
    }
  }, []);

  useEffect(() => {
    loadSpecies();
    loadHistory();
  }, [loadSpecies, loadHistory]);

  // Run calculation logic (API or client-side fallback)
  const runCalculation = useCallback(async () => {
    setLoading(true);
    const payload = {
      wall_area_m2: wallArea,
      plant_type: plantType,
      temperature_c: temperature,
      humidity,
      solar_radiation: solarRadiation,
      cop,
      electricity_rate: electricityRate
    };

    try {
      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setCoolingKwh(data.cooling_kwh);
        setDetails(data.details);
        setCalcResult(data);
        loadHistory();
      } else {
        throw new Error("Calculation engine error");
      }
    } catch (err) {
      // Client-side calculations fallback logic
      const species = speciesList.find(s => s.key === plantType) || FALLBACK_SPECIES[0];
      
      const es = 0.61078 * Math.exp((17.27 * temperature) / (temperature + 237.3));
      const ea = es * (humidity / 100.0);
      const vpd = Math.max(0.0, es - ea);
      const delta = (4098.0 * es) / Math.pow(temperature + 237.3, 2);
      const gamma = 0.066;
      const rs_mj = solarRadiation * 0.0864;
      const rn = 0.7 * rs_mj;

      const u_wind = 2.0;
      const num_rad = 0.408 * delta * rn;
      const num_aero = gamma * (900.0 / (temperature + 273.0)) * u_wind * vpd;
      const den = delta + gamma * (1.0 + 0.34 * u_wind);
      const et0 = Math.max(0.0, (num_rad + num_aero) / den);

      const transpired_volume = wallArea * 3.0 * species.transpiration_rate_coeff * et0;
      const latent_cooling_kwh = transpired_volume * 2.45 * 0.277778;

      const solar_kwh_m2 = solarRadiation * 0.024;
      const bare_solar = wallArea * solar_kwh_m2 * 0.7;
      const transmission = Math.exp(-species.shading_extinction_coeff * 3.0);
      const shading_savings_kwh = bare_solar * (1.0 - transmission);

      let insulation_savings_kwh = 0;
      let bare_conduction = 0;
      let vegetated_conduction = 0;
      if (temperature > 22.0) {
        const u_bare = 1.0 / 0.5;
        const u_green = 1.0 / (0.5 + species.added_r_value);
        const t_diff = temperature - 22.0;
        bare_conduction = (wallArea * u_bare * t_diff * 24.0) / 1000.0;
        vegetated_conduction = (wallArea * u_green * t_diff * 24.0) / 1000.0;
        insulation_savings_kwh = bare_conduction - vegetated_conduction;
      }

      const baseline_heat_gain = bare_solar + bare_conduction;
      const vegetated_heat_gain = (bare_solar * transmission) + vegetated_conduction - latent_cooling_kwh;
      const net_reduction = baseline_heat_gain - vegetated_heat_gain;
      const saved_kwh = net_reduction / cop;

      const daily_savings_usd = saved_kwh * electricityRate;
      const monthly_savings_usd = daily_savings_usd * 30.4375;
      const annual_savings_usd = daily_savings_usd * 365.0;
      const annual_co2_reduction_kg = saved_kwh * 365.0 * 0.38;

      const fallbackDetails = {
        water_transpired_liters: transpired_volume,
        latent_cooling_kwh,
        shading_savings_kwh,
        insulation_savings_kwh,
        daily_savings_usd,
        monthly_savings_usd,
        annual_savings_usd,
        annual_co2_reduction_kg
      };

      const fallbackResult: CalculateResult = {
        cooling_kwh: saved_kwh,
        cost_saved: daily_savings_usd,
        co2_saved: saved_kwh * 0.38,
        details: fallbackDetails,
        baseline_heat_gain,
        vegetated_heat_gain,
        net_reduction,
        hvac_offset: saved_kwh,
        confidence_range_low: saved_kwh * 0.925,
        confidence_range_high: saved_kwh * 1.075,
        package_id: "VRM-2025-LOCAL",
        equation_version: "v1.2",
        species_dataset_version: "v0.3",
        financial_model_version: "v1.0",
        weather_assumption_version: "v1.0",
        generated_at: new Date().toISOString()
      };

      setCoolingKwh(saved_kwh);
      setDetails(fallbackDetails);
      setCalcResult(fallbackResult);
    } finally {
      setLoading(false);
    }
  }, [wallArea, plantType, temperature, humidity, solarRadiation, cop, electricityRate, speciesList, loadHistory]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden flex flex-col font-sans px-4 py-8 md:px-12 md:py-16">
      
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-950/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-950/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto flex flex-col gap-8 z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center w-full pb-5 border-b border-white/5">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-emerald-400">Viridimetrics</span>
              <span className="text-[9px] uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold tracking-wider">Enterprise</span>
            </h1>
            <span className="text-[10px] text-gray-500 mt-0.5">Commercial green wall thermal performance analyzer</span>
          </div>

          <div className="flex items-center gap-2">
            {isOfflineMode ? (
              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded font-mono flex items-center gap-1.5 border border-amber-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Local Engine (Offline)
              </span>
            ) : (
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-mono flex items-center gap-1.5 border border-emerald-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                FastAPI Connected
              </span>
            )}
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl w-fit border border-white/5">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition focus:outline-none ${
              activeTab === 'calculator' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Asset Calculator
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition focus:outline-none ${
              activeTab === 'simulation' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Scenario Lab
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition focus:outline-none ${
              activeTab === 'reports' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Reports & Ingestion
          </button>
        </div>

        {/* Dynamic Tab Workspace */}
        <main className="w-full">
          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 w-full">
                <InputPanel
                  wallArea={wallArea}
                  setWallArea={setWallArea}
                  temperature={temperature}
                  setTemperature={setTemperature}
                  humidity={humidity}
                  setHumidity={setHumidity}
                  solarRadiation={solarRadiation}
                  setSolarRadiation={setSolarRadiation}
                  plantType={plantType}
                  setPlantType={setPlantType}
                  speciesList={speciesList}
                  cop={cop}
                  setCop={setCop}
                  electricityRate={electricityRate}
                  setElectricityRate={setElectricityRate}
                />
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6 w-full">
                <CoolingOffsetPanel
                  calcResult={calcResult}
                  loading={loading}
                />
                
                <CapitalInvestmentJustification
                  wallArea={wallArea}
                  coolingKwh={coolingKwh}
                  electricityRate={electricityRate}
                />

                <ThermalAssumptionDrawer />
              </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="w-full">
              <BuildingScenarioComparison
                speciesList={speciesList}
                temperature={temperature}
                humidity={humidity}
                solarRadiation={solarRadiation}
              />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="flex flex-col gap-6 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <UtilityAuditLogImporter onImportSuccess={loadHistory} />
                <ExecutiveReportExporter
                  wallArea={wallArea}
                  plantType={plantType}
                  coolingKwh={coolingKwh}
                  electricityRate={electricityRate}
                />
              </div>

              <BotanicalCoefficientCatalog speciesList={speciesList} />

              {/* History / Audit Logs Table */}
              {!isOfflineMode && history.length > 0 && (
                <section className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-2">
                  <div className="flex flex-col">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Calculation Audit Trail</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Historical verification log of simulation runs.</p>
                  </div>
                  
                  <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-white/5">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-400 font-semibold bg-white/5">
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">Package ID</th>
                          <th className="px-4 py-3">Species</th>
                          <th className="px-4 py-3">Area (m²)</th>
                          <th className="px-4 py-3">Temp (°C)</th>
                          <th className="px-4 py-3">Humidity</th>
                          <th className="px-4 py-3">Solar (W/m²)</th>
                          <th className="px-4 py-3 text-right">Cooling (kWh)</th>
                          <th className="px-4 py-3 text-right">Saved ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300 font-mono">
                        {history.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition">
                            <td className="px-4 py-2.5 text-gray-500 text-[10px]">
                              {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="px-4 py-2.5 text-[10px] text-gray-400 font-mono">
                              {log.package_id || "VRM-LOCAL"}
                            </td>
                            <td className="px-4 py-2.5 text-emerald-400 font-sans">{log.plant_type}</td>
                            <td className="px-4 py-2.5">{log.wall_area_m2}</td>
                            <td className="px-4 py-2.5">{log.temperature_c}</td>
                            <td className="px-4 py-2.5">{log.humidity}%</td>
                            <td className="px-4 py-2.5">{log.solar_radiation}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-white">{log.cooling_kwh.toFixed(1)}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-amber-400">${log.cost_saved.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
