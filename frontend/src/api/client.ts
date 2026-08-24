import axios from 'axios';

const metaObj: any = import.meta;
const API_BASE_URL = (metaObj && metaObj.env && metaObj.env.VITE_API_BASE_URL) ? metaObj.env.VITE_API_BASE_URL : '/api';

export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const datasetsAPI = {
  upload: (formData: FormData, projectId: number) =>
    client.post(`/datasets/upload?project_id=${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (projectId: number) =>
    client.get(`/datasets/?project_id=${projectId}`),
  getInfo: (datasetId: number) =>
    client.get(`/datasets/${datasetId}`),
  delete: (datasetId: number) =>
    client.delete(`/datasets/${datasetId}`),
  getPreview: (datasetId: number, rows?: number) =>
    client.get(`/datasets/${datasetId}/preview`, { params: { rows: rows || 10 } }),
};

export const edaAPI = {
  getAnalysis: (datasetId: number) =>
    client.get(`/eda/${datasetId}/analysis`),
  preprocess: (datasetId: number, config: any) =>
    client.post(`/eda/${datasetId}/preprocess`, config),
  getStatistics: (datasetId: number, statType: string = 'all') =>
    client.get(`/eda/${datasetId}/statistics`, { params: { stat_type: statType } }),
};

export const modelsAPI = {
  list: () => client.get('/models/'),
  recommend: (datasetId: number, targetColumn?: string, topN: number = 5) =>
    client.post(`/models/recommend?dataset_id=${datasetId}${targetColumn ? `&target_column=${targetColumn}` : ''}&top_n=${topN}`),
  getInfo: (modelName: string) => client.get(`/models/${modelName}/info`),
};

export const experimentsAPI = {
  create: (datasetId: number, name: string, description?: string, config?: any) =>
    client.post('/experiments/', { dataset_id: datasetId, name, description, config }),
  list: (datasetId?: number) =>
    client.get(`/experiments/${datasetId ? `?dataset_id=${datasetId}` : ''}`),
  get: (experimentId: number) => client.get(`/experiments/${experimentId}`),
};

export const trainingAPI = {
  start: (experimentId: number, config: { target_column: string; task_type?: string; test_size?: number; model_names?: string[] }) =>
    client.post(`/training/${experimentId}/train`, config),
  getResults: (experimentId: number) => client.get(`/training/${experimentId}/results`),
  getComparison: (experimentId: number, metric: string = 'f1') =>
    client.get(`/training/${experimentId}/comparison`, { params: { metric } }),
};

export const hyperparameterAPI = {
  tune: (experimentId: number, modelName: string, config: any) =>
    client.post(`/hyperparameter/${experimentId}/tune/${modelName}`, config),
};

export const featureEngineeringAPI = {
  engineer: (datasetId: number, config: any) =>
    client.post(`/feature-engineering/${datasetId}/engineer`, config),
  getSuggestions: (datasetId: number) =>
    client.get(`/feature-engineering/${datasetId}/suggestions`),
};

export const deepLearningAPI = {
  train: (experimentId: number, config: any) =>
    client.post(`/deep-learning/${experimentId}/train`, config),
};

export const explainabilityAPI = {
  explain: (experimentId: number, modelName: string, targetColumn: string, taskType: string = 'classification') =>
    client.get(`/explainability/${experimentId}/explain/${modelName}`, { params: { target_column: targetColumn, task_type: taskType } }),
};

export const reportsAPI = {
  generate: (experimentId: number, format: string = 'markdown') =>
    client.get(`/reports/${experimentId}/generate`, { params: { format } }),
};

export const tasksAPI = {
  getStatus: (taskId: string) => client.get(`/tasks/status/${taskId}`),
  list: () => client.get('/tasks/'),
  cancel: (taskId: string) => client.post(`/tasks/cancel/${taskId}`),
  getStats: () => client.get('/tasks/stats'),
};

export const cachedAPI = {
  getStatistics: (datasetId: number, statType: string = 'all') =>
    client.get(`/cached/${datasetId}/statistics`, { params: { stat_type: statType } }),
  getPreview: (datasetId: number, rows?: number) =>
    client.get(`/cached/${datasetId}/preview`, { params: { rows } }),
  clearCache: (datasetId: number) => client.post(`/cached/${datasetId}/clear-cache`),
};

export const asyncTrainingAPI = {
  trainAsync: (datasetId: number, config: any) =>
    client.post(`/async-training/${datasetId}/train-async`, config),
  preprocessAsync: (datasetId: number, config: any) =>
    client.post(`/async-training/${datasetId}/preprocess-async`, config),
  tuneAsync: (experimentId: number, modelName: string, config: any) =>
    client.post(`/async-training/${experimentId}/tune-async/${modelName}`, config),
};

export const monitoringAPI = {
  getHealth: () => client.get('/monitoring/health'),
  getCeleryWorkers: () => client.get('/monitoring/celery/workers'),
  getDatabaseStatus: () => client.get('/monitoring/database/connection'),
  getRedisStatus: () => client.get('/monitoring/redis/connection'),
  getRecentLogs: (lines: number = 100) => client.get('/monitoring/logs', { params: { lines } }),
};

export const authAPI = {
  register: (user: { email: string; username: string; password: string; full_name?: string }) =>
    client.post('/auth/register', user),
  login: (credentials: FormData) =>
    client.post('/auth/login', credentials, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
  getMe: () => client.get('/auth/me'),
  logout: () => client.post('/auth/logout'),
};

export const healthAPI = {
  getFullHealth: () => client.get('/health/full'),
  getDbHealth: () => client.get('/health/db'),
  getCacheHealth: () => client.get('/health/cache'),
  getCeleryHealth: () => client.get('/health/celery'),
  getSystemHealth: () => client.get('/health/system'),
};

export const timeSeriesAPI = {
  analyze: (datasetId: number, config: any) =>
    client.post(`/time-series/${datasetId}/analyze`, config),
  forecast: (datasetId: number, config: any) =>
    client.post(`/time-series/${datasetId}/forecast`, config),
  getModels: () => client.get('/time-series/models'),
};

export const nlpAPI = {
  analyzeSentiment: (datasetId: number, config: any) =>
    client.post(`/nlp/${datasetId}/sentiment`, config),
  extractKeywords: (datasetId: number, config: any) =>
    client.post(`/nlp/${datasetId}/keywords`, config),
  extractTopics: (datasetId: number, config: any) =>
    client.post(`/nlp/${datasetId}/topics`, config),
  getStatistics: (datasetId: number, textColumn: string) =>
    client.get(`/nlp/${datasetId}/statistics`, { params: { text_column: textColumn } }),
};

export const cvAPI = {
  classify: (file: FormData, modelType: string = 'resnet50', topK: number = 5) =>
    client.post(`/cv/classify?model_type=${modelType}&top_k=${topK}`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  extractFeatures: (file: FormData, modelType: string = 'resnet50') =>
    client.post(`/cv/extract-features?model_type=${modelType}`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStatistics: (file: FormData) =>
    client.post('/cv/statistics', file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getModels: () => client.get('/cv/models'),
};

export const auditAPI = {
  getLogs: (limit: number = 100, offset: number = 0, action?: string, resourceType?: string) =>
    client.get('/audit/logs', { params: { limit, offset, action, resource_type: resourceType } }),
  getUserLogs: (userId: number, limit: number = 100) =>
    client.get(`/audit/logs/user/${userId}`, { params: { limit } }),
  exportLogs: () => client.get('/audit/logs/export', { responseType: 'blob' }),
};

export const ssoAPI = {
  getProviders: () => client.get('/sso/providers'),
  callback: (provider: string, code: string, redirectUri: string) =>
    client.post(`/sso/${provider}/callback`, { code, redirect_uri: redirectUri }),
};

export const apiKeysAPI = {
  create: (name: string, expiresInDays?: number) =>
    client.post('/api-keys/create', { name, expires_in_days: expiresInDays }),
  list: () => client.get('/api-keys/list'),
  revoke: (apiKeyId: number) => client.post(`/api-keys/revoke/${apiKeyId}`),
};

export const billingAPI = {
  getUsage: (month?: string) => client.get('/billing/usage', { params: { month } }),
  getPlan: () => client.get('/billing/plan'),
  upgradePlan: (plan: string) => client.post('/billing/upgrade', { plan }),
};

export const automlAPI = {
  run: (datasetId: number, config: any) =>
    client.post(`/automl/${datasetId}/run`, config),
  getStatus: (experimentId: number) =>
    client.get(`/automl/${experimentId}/status`),
  saveModel: (experimentId: number, modelName?: string) =>
    client.post(`/automl/${experimentId}/save-model`, { model_name: modelName }),
};

export const experimentTrackingAPI = {
  create: (datasetId: number, name: string, description?: string, config?: any) =>
    client.post('/experiments-tracking/create', { dataset_id: datasetId, name, description, config }),
  logMetrics: (experimentId: number, metrics: Record<string, number>, step: number = 1) =>
    client.post(`/experiments-tracking/${experimentId}/log-metrics`, { metrics, step }),
  complete: (experimentId: number, results: any) =>
    client.post(`/experiments-tracking/${experimentId}/complete`, { results }),
  getHistory: (datasetId: number, limit: number = 50) =>
    client.get(`/experiments-tracking/${datasetId}/history`, { params: { limit } }),
  compare: (experimentIds: number[]) =>
    client.post('/experiments-tracking/compare', experimentIds),
};

export const modelComparisonAPI = {
  compareMatrix: (modelsResults: Record<string, Record<string, number>>) =>
    client.post('/model-comparison/compare-matrix', { models_results: modelsResults }),
  scoreModels: (modelsResults: Record<string, Record<string, number>>, weights?: Record<string, number>) =>
    client.post('/model-comparison/score-models', { models_results: modelsResults, weights }),
  getBestModel: (modelsResults: Record<string, Record<string, number>>, targetMetric: string = 'accuracy') =>
    client.post('/model-comparison/best-model', { models_results: modelsResults, target_metric: targetMetric }),
};

export const marketplaceAPI = {
  publish: (modelData: any) => client.post('/marketplace/models/publish', modelData),
  search: (params: any) => client.get('/marketplace/models/search', { params }),
  getTrending: (days: number = 7, limit: number = 10) => client.get('/marketplace/models/trending', { params: { days, limit } }),
  getDetails: (slug: string) => client.get(`/marketplace/models/${slug}`),
  addReview: (modelId: number, review: { rating: number; title: string; review_text: string }) =>
    client.post(`/marketplace/models/${modelId}/review`, review),
  download: (modelId: number) => client.post(`/marketplace/models/${modelId}/download`),
  purchase: (modelId: number, durationDays: number = 365) =>
    client.post(`/marketplace/models/${modelId}/purchase`, null, { params: { duration_days: durationDays } }),
  getEarnings: (month?: string) => client.get('/marketplace/earnings', { params: { month } }),
  getMyModels: () => client.get('/marketplace/my-models'),
};

export const modelInferenceAPI = {
  infer: (modelId: number, inputData: Record<string, any>) =>
    client.post('/inference/infer', { model_id: modelId, input_data: inputData }),
  batchInfer: (modelId: number, inputData: Record<string, any>[]) =>
    client.post('/inference/infer/batch', { model_id: modelId, input_data: inputData }),
  getApiSchema: (modelId: number) => client.get(`/inference/models/${modelId}/api-schema`),
};

export const mlopsAPI = {
  registerModel: (modelData: any) => client.post('/mlops/models/register', modelData),
  createVersion: (registryId: number, versionData: any) =>
    client.post(`/mlops/models/${registryId}/versions`, versionData),
  validateVersion: (registryId: number, versionId: number, testResults: any) =>
    client.post(`/mlops/models/${registryId}/versions/${versionId}/validate`, testResults),
  deployModel: (registryId: number, deploymentData: any) =>
    client.post(`/mlops/models/${registryId}/deploy`, deploymentData),
  getRegistry: (registryId: number) => client.get(`/mlops/models/${registryId}`),
  createABTest: (abTestData: any) => client.post('/mlops/ab-tests', abTestData),
  rollbackDeployment: (deploymentId: number, rollbackData: any) =>
    client.post(`/mlops/deployments/${deploymentId}/rollback`, rollbackData),
  recordMetrics: (deploymentId: number, metricsData: any) =>
    client.post(`/mlops/deployments/${deploymentId}/metrics`, metricsData),
};

export const analyticsAPI = {
  calculateSampleSize: (data: { baseline_rate: number; min_effect_size?: number; alpha?: number; beta?: number }) =>
    client.post('/analytics/sample-size', data),
  powerAnalysis: (data: { baseline_rate: number; effect_size: number; sample_size: number; alpha?: number }) =>
    client.post('/analytics/power-analysis', data),
  analyzeTest: (data: { control_data: number[]; variant_data: number[]; metric_type?: string }) =>
    client.post('/analytics/analyze-test', data),
  sequentialAnalysis: (data: { control_values: number[]; variant_values: number[]; stopping_rule?: string }) =>
    client.post('/analytics/sequential-analysis', data),
};

export default client;






