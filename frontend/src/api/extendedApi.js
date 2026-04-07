const API_BASE = '/api';

export async function calculateMultiplePlots(data) {
  const response = await fetch(`${API_BASE}/multiple-plots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка при расчете');
  return await response.json();
}

export async function compareScenarios(data) {
  const response = await fetch(`${API_BASE}/scenarios/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка при сравнении');
  return await response.json();
}

export async function calculateMonthlyPlan(data) {
  const response = await fetch(`${API_BASE}/monthly-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Ошибка при расчете');
  return await response.json();
}

export async function saveToHistory(data, notes = null) {
  const response = await fetch(`${API_BASE}/history/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calculation_data: data, notes }),
  });
  if (!response.ok) throw new Error('Ошибка при сохранении');
  return await response.json();
}

export async function getHistory(limit = 50) {
  const response = await fetch(`${API_BASE}/history?limit=${limit}`);
  if (!response.ok) throw new Error('Ошибка при загрузке истории');
  return await response.json();
}

export async function getWaterTrends(crop = null, days = 30) {
  const url = `${API_BASE}/analytics/trends?days=${days}${crop ? `&crop=${crop}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Ошибка при загрузке трендов');
  return await response.json();
}

export async function getCropStatistics() {
  const response = await fetch(`${API_BASE}/analytics/crop-statistics`);
  if (!response.ok) throw new Error('Ошибка при загрузке статистики');
  return await response.json();
}

