import api from './api';

/**
 * Adaptive Learning Frontend Service
 *
 * Provides typed, clean methods for interacting with the backend
 * adaptive learning workflow using the standard application API client.
 */

// Generate or retrieve the next adaptive activity for a module
export const getNextAdaptiveActivity = async (moduleId, options = {}) => {
  const { forceNew = false, allowAdvance = false, format = null, topicId = null } = options;
  const params = new URLSearchParams();
  if (forceNew) params.append('forceNew', 'true');
  if (allowAdvance) params.append('allowAdvance', 'true');
  if (format) params.append('format', format);
  if (topicId) params.append('topicId', topicId);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await api.post(`/adaptive/generate/${moduleId}${queryString}`, {
    forceNew,
    allowAdvance,
    format,
    topicId,
  });
  return data;
};

// Retrieve a specific adaptive activity by its ID
export const getAdaptiveActivity = async (activityId) => {
  const { data } = await api.get(`/adaptive/activity/${activityId}`);
  return data;
};

// Submit student answer for an adaptive activity
export const submitAdaptiveActivity = async (activityId, answer) => {
  const { data } = await api.post(`/adaptive/submit/${activityId}`, { answer });
  return data;
};

// Get student's learner state summary for a specific module
export const getLearnerModuleSummary = async (moduleId) => {
  const { data } = await api.get(`/adaptation/summary/${moduleId}`);
  return data;
};

// Get student's next adaptation plan for a module
export const getNextAdaptationPlan = async (moduleId) => {
  const { data } = await api.get(`/adaptation/next/${moduleId}`);
  return data;
};

// Get student's recent adaptive activity history for a module
export const getAdaptiveHistory = async (moduleId) => {
  const { data } = await api.get(`/adaptive/history/${moduleId}`);
  return data;
};

// Get student's overall topic mastery list
export const getAllTopicMastery = async () => {
  const { data } = await api.get('/adaptation/mastery');
  return data;
};

// Get faculty/research analytics for a module
export const getModuleResearchAnalytics = async (moduleId) => {
  const { data } = await api.get(`/adaptation/module/${moduleId}/research-analytics`);
  return data;
};

// Export raw research trace sequence for a module
export const getModuleResearchTrace = async (moduleId) => {
  const { data } = await api.get(`/adaptation/module/${moduleId}/research-trace`);
  return data;
};

export default {
  getNextAdaptiveActivity,
  getAdaptiveActivity,
  submitAdaptiveActivity,
  getLearnerModuleSummary,
  getNextAdaptationPlan,
  getAdaptiveHistory,
  getAllTopicMastery,
  getModuleResearchAnalytics,
  getModuleResearchTrace,
};
