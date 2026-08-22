import { useState } from 'react';
import axios from 'axios';

interface ReportGeneratorProps {
  experimentId: number;
}

export default function ReportGenerator({ experimentId }: ReportGeneratorProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [reportMarkdown, setReportMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async (format: 'markdown' | 'html' = 'markdown') => {
    setLoading(true);
    setError(null);

    try {
      if (format === 'html') {
        window.open(`http://localhost:8000/api/reports/${experimentId}/generate?format=html`, '_blank');
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:8000/api/reports/${experimentId}/generate?format=markdown`);
      setReportMarkdown(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automated Report Generator</h2>
          <p className="text-gray-600 text-sm mt-1">
            Generate executive Markdown or HTML reports summarizing model performance, top algorithms, and insights
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchReport('markdown')}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-lg text-sm transition"
          >
            Preview Markdown
          </button>
          <button
            onClick={() => fetchReport('html')}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
          >
            Export HTML Report ↗
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {reportMarkdown && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-xs text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-96">
          {reportMarkdown}
        </div>
      )}
    </div>
  );
}
