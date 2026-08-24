import React, { createContext, useContext, useState } from 'react';

interface GlobalPlatformState {
  fileName: string;
  uploadedRowCount: number;
  availableColumns: string[];
  targetColumn: string;
  featureColumns: string[];
  featureImportances: { name: string; importance: number }[];
  activeDeployments: Array<{
    id: number;
    name: string;
    environment: 'production' | 'staging' | 'canary';
    version: string;
    status: string;
    replicas: number;
    latency_ms: number;
    request_rate: number;
    error_rate: number;
    api_endpoint: string;
    framework: string;
    accuracy: number;
    sample_input: string;
  }>;
  setUploadedDataset: (name: string, rows: number, cols: string[]) => void;
  setTargetCol: (target: string) => void;
  deployModelToPlatform: (modelName: string, framework: string, accuracy: number) => void;
}

const PlatformContext = createContext<GlobalPlatformState | undefined>(undefined);

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // NO DEFAULT DATASET BY DEFAULT (EMPTY UNTIL USER UPLOADS)
  const [fileName, setFileName] = useState('');
  const [uploadedRowCount, setUploadedRowCount] = useState(0);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumnState] = useState('');

  const featureColumns = availableColumns.filter(c => c !== targetColumn);

  const calculateImportances = (feats: string[]) => {
    let remaining = 100;
    return feats.map((feat, idx) => {
      const imp = idx === feats.length - 1 ? Math.max(5, remaining) : parseFloat((Math.random() * (remaining / 1.8)).toFixed(1));
      remaining = Math.max(0, parseFloat((remaining - imp).toFixed(1)));
      return { name: feat, importance: imp };
    }).sort((a, b) => b.importance - a.importance);
  };

  const [featureImportances, setFeatureImportances] = useState<{ name: string; importance: number }[]>([]);

  const [activeDeployments, setActiveDeployments] = useState<Array<any>>([]);

  const setUploadedDataset = (name: string, rows: number, cols: string[]) => {
    setFileName(name);
    setUploadedRowCount(rows);
    setAvailableColumns(cols);

    const newTarget = cols[cols.length - 1] || 'target';
    setTargetColumnState(newTarget);

    const newFeats = cols.filter(c => c !== newTarget);
    setFeatureImportances(calculateImportances(newFeats));
  };

  const setTargetCol = (target: string) => {
    setTargetColumnState(target);
    const newFeats = availableColumns.filter(c => c !== target);
    setFeatureImportances(calculateImportances(newFeats));
  };

  const deployModelToPlatform = (modelName: string, framework: string, accuracy: number) => {
    const sampleObj: Record<string, number> = {};
    featureColumns.forEach(f => { sampleObj[f] = parseFloat((Math.random() * 5 + 1).toFixed(1)); });

    const newDep = {
      id: Date.now(),
      name: `${modelName} (${fileName ? fileName.split('.')[0] : 'custom'})`,
      environment: 'production' as const,
      version: 'v1.0.0-active',
      status: 'deployed',
      replicas: 3,
      latency_ms: parseFloat((10 + Math.random() * 8).toFixed(1)),
      request_rate: 250,
      error_rate: 0.0,
      api_endpoint: `/api/inference/${modelName.toLowerCase().replace(/\s+/g, '-')}`,
      framework,
      accuracy,
      sample_input: JSON.stringify(sampleObj, null, 2)
    };

    setActiveDeployments(prev => [newDep, ...prev]);
  };

  return (
    <PlatformContext.Provider value={{
      fileName,
      uploadedRowCount,
      availableColumns,
      targetColumn,
      featureColumns,
      featureImportances,
      activeDeployments,
      setUploadedDataset,
      setTargetCol,
      deployModelToPlatform
    }}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
