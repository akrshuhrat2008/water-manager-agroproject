const API_BASE = '/api';

export async function getRegions() {
  const response = await fetch(`${API_BASE}/data/regions`);
  if (!response.ok) throw new Error('Ошибка при загрузке регионов');
  return await response.json();
}

export async function initializeData() {
  const response = await fetch(`${API_BASE}/data/initialize`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Ошибка при инициализации данных');
  return await response.json();
}

export async function getCropNorms(cropId, regionName) {
  const url = `${API_BASE}/data/crop-norms/${cropId}/${regionName}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Ошибка при загрузке норм');
  return await response.json();
}

