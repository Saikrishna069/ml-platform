import React, { useState } from 'react';

interface DatasetInfo {
  id: number;
  filename: string;
  rows: number;
  columns: number;
  created_at: string;
  missing_values: number;
  column_names: string[];
}

export default function DatasetStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([
    {
      id: 1,
      filename: 'customer_churn_sample.csv',
      rows: 1000,
      columns: 12,
      created_at: new Date().toISOString(),
      missing_values: 0,
      column_names: ['customer_id', 'age', 'tenure', 'balance', 'num_products', 'has_credit_card', 'is_active', 'estimated_salary', 'churn']
    }
  ]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetInfo | null>(datasets[0]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = () => {
    if (!file) return;
    setIsUploading(true);

    setTimeout(() => {
      const newDataset: DatasetInfo = {
        id: datasets.length + 1,
        filename: file.name,
        rows: 2500,
        columns: 15,
        created_at: new Date().toISOString(),
        missing_values: 3,
        column_names: ['id', 'feature_1', 'feature_2', 'feature_3', 'target']
      };
      setDatasets([newDataset, ...datasets]);
      setSelectedDataset(newDataset);
      setIsUploading(false);
      setFile(null);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dataset & EDA Studio</h1>
          <p className="text-gray-600">Upload CSV, Excel, or Parquet datasets for automatic exploratory analysis & profiling</p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Upload New Dataset</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <input
              type="file"
              accept=".csv,.xlsx,.parquet,.json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg"
            />
            <button
              onClick={uploadFile}
              disabled={!file || isUploading}
              className={`px-6 py-2.5 rounded-lg text-white font-bold transition-colors min-w-[140px] ${
                !file || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isUploading ? 'Analyzing...' : 'Analyze Dataset'}
            </button>
          </div>
        </div>

        {/* Dataset Details & Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Datasets List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Uploaded Datasets</h2>
            <div className="space-y-3">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  onClick={() => setSelectedDataset(ds)}
                  className={`p-4 rounded-lg cursor-pointer border transition-all ${
                    selectedDataset?.id === ds.id
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold text-gray-900 truncate">{ds.filename}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <span>{ds.rows.toLocaleString()} rows</span>
                    <span>{ds.columns} columns</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EDA Analysis View */}
          {selectedDataset && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Summary Statistics & Profiling</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Rows</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{selectedDataset.rows.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Columns</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{selectedDataset.columns}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Missing Values</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{selectedDataset.missing_values}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Health Score</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">98.5%</p>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-3">Detected Columns</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDataset.column_names.map((col, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-mono">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
