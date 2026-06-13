'use client';

import React, { useState } from 'react';

interface IngestResults {
  status: string;
  imported_rows: number;
  failed_rows: number;
  errors: string[];
}

interface UtilityAuditLogImporterProps {
  onImportSuccess: () => void;
}

export default function UtilityAuditLogImporter({ onImportSuccess }: UtilityAuditLogImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<IngestResults | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setResults(null);
    }
  };

  const handleIngest = async () => {
    if (!file) {
      setErrorMsg("Please select a file to ingest.");
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    setResults(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (res.ok) {
        setResults({
          status: data.status,
          imported_rows: data.imported_rows,
          failed_rows: data.failed_rows,
          errors: data.errors || []
        });
        onImportSuccess();
      } else {
        setErrorMsg(data.detail || "Failed to parse utility file.");
      }
    } catch (err) {
      setErrorMsg("Unable to connect to ingestion server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 p-6 rounded-2xl glass-panel text-white">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-emerald-400">Utility Operations Ingestion</h2>
        <p className="text-[11px] text-gray-400 mt-1">
          Ingest utility CSV audit logs containing area baselines, ambient conditions, and meter metrics.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative border border-dashed border-white/20 rounded-xl p-4 hover:border-white/40 transition flex items-center justify-between">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <span className="text-xs text-gray-300">
            {file ? file.name : "Select audit log file (.csv)"}
          </span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <button
          onClick={handleIngest}
          disabled={loading || !file}
          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-zinc-800 disabled:text-gray-500 font-semibold px-6 py-3 rounded-xl text-xs text-black tracking-wider uppercase transition cursor-pointer"
        >
          {loading ? "Processing..." : "Ingest Data"}
        </button>
      </div>

      {errorMsg && (
        <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl">
          {errorMsg}
        </div>
      )}

      {results && (
        <div className="p-4 rounded-xl border border-white/5 bg-white/5 text-xs flex flex-col gap-2.5 animate-fade-in">
          <div className="flex justify-between border-b border-white/5 pb-1 font-semibold">
            <span>Ingestion Pipeline Status</span>
            <span className={results.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}>
              {results.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">Rows Imported</span>
              <span className="text-lg font-bold text-white mt-1">{results.imported_rows}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400">Rows Failed</span>
              <span className="text-lg font-bold text-white mt-1">{results.failed_rows}</span>
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              <span className="text-gray-400 font-semibold uppercase text-[9px]">Ingestion Warnings</span>
              <ul className="list-disc pl-4 text-[10px] text-amber-400 space-y-0.5">
                {results.errors.map((err, idx) => (
                  <li key={idx} className="font-mono">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
