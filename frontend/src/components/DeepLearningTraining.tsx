import { useState } from 'react';
import axios from 'axios';

interface DeepLearningTrainingProps {
  experimentId: number;
  targetColumn: string;
  taskType?: 'classification' | 'regression';
  onTrainingComplete?: (result: any) => void;
}

export default function DeepLearningTraining({
  experimentId,
  targetColumn,
  taskType = 'classification',
  onTrainingComplete,
}: DeepLearningTrainingProps) {
  const [modelType, setModelType] = useState<'mlp' | 'cnn' | 'lstm'>('mlp');
  const [epochs, setEpochs] = useState<number>(30);
  const [batchSize, setBatchSize] = useState<number>(32);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTraining = async () => {
    setIsTraining(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`http://localhost:8000/api/deep-learning/${experimentId}/train`, {
        target_column: targetColumn,
        task_type: taskType,
        model_type: modelType,
        epochs,
        batch_size: batchSize,
      });

      setResult(response.data);
      if (onTrainingComplete) {
        onTrainingComplete(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Deep learning training failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Deep Learning & Neural Networks</h2>
        <p className="text-gray-600 text-sm mt-1">
          Train Multi-Layer Perceptrons (MLP), 1D CNNs, or LSTMs on dataset features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Architecture</label>
          <select
            value={modelType}
            onChange={(e: any) => setModelType(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
          >
            <option value="mlp">Multi-Layer Perceptron (MLP)</option>
            <option value="cnn">1D Convolutional Neural Net (CNN)</option>
            <option value="lstm">Long Short-Term Memory (LSTM)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Epochs</label>
          <input
            type="number"
            value={epochs}
            onChange={(e) => setEpochs(Number(e.target.value))}
            min={5}
            max={200}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
          <select
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm"
          >
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
            <option value={128}>128</option>
          </select>
        </div>
      </div>

      <button
        onClick={startTraining}
        disabled={isTraining}
        className={`w-full py-3 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
          isTraining ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {isTraining ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Training Neural Network ({epochs} Epochs)...
          </>
        ) : (
          <>🧠 Train {modelType.toUpperCase()} Neural Network</>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-bold text-indigo-900">Neural Network Training Completed</h3>
          <p className="text-sm text-indigo-800">
            Model Type: <span className="font-bold uppercase">{result.model_type}</span> | Status: <span className="font-bold text-green-700">Success</span>
          </p>
        </div>
      )}
    </div>
  );
}
