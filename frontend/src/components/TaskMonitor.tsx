import { useState, useEffect } from 'react';
import axios from 'axios';

interface TaskStatus {
  task_id: string;
  status: string;
  result?: any;
  info?: any;
}

interface TaskMonitorProps {
  taskId: string;
  onComplete?: (result: any) => void;
  autoRefresh?: boolean;
}

export default function TaskMonitor({
  taskId,
  onComplete,
  autoRefresh = true,
}: TaskMonitorProps) {
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/tasks/status/${taskId}`
        );
        setStatus(response.data);
        
        if (response.data.status === 'SUCCESS' && onComplete) {
          onComplete(response.data.result);
        }
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to fetch task status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    let interval: any;
    if (autoRefresh && status?.status !== 'SUCCESS' && status?.status !== 'FAILURE') {
      interval = setInterval(fetchStatus, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [taskId, autoRefresh, status?.status]);

  const cancelTask = async () => {
    try {
      await axios.post(`http://localhost:8000/api/tasks/cancel/${taskId}`);
      setStatus(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel task');
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'SUCCESS':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">✓ Completed</span>;
      case 'FAILURE':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">✕ Failed</span>;
      case 'CANCELLED':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">🚫 Cancelled</span>;
      case 'PROGRESS':
      case 'STARTED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold animate-pulse">⚡ Processing</span>;
      default:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">⏳ Queued</span>;
    }
  };

  if (loading && !status) {
    return (
      <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3 text-sm text-gray-600">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        Checking async task status...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Background Task Monitor</h3>
          <p className="text-xs text-gray-500 font-mono mt-0.5">Task ID: {taskId}</p>
        </div>

        <div className="flex items-center gap-3">
          {status && getStatusBadge(status.status)}
          {status && (status.status === 'PROGRESS' || status.status === 'STARTED' || status.status === 'PENDING') && (
            <button
              onClick={cancelTask}
              className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg text-xs transition"
            >
              Cancel Task
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-xs">
          ❌ {error}
        </div>
      )}

      {status?.info && typeof status.info === 'object' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600 font-medium">
            <span>Model {status.info.current} of {status.info.total}</span>
            <span>{Math.round((status.info.current / status.info.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(status.info.current / status.info.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
