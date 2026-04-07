// Определяем базовый URL API
// В development режиме используем прокси из vite.config.js
// В production используем относительный путь
const API_BASE = import.meta.env.DEV ? '/api' : '/api';

export async function calculateWater(data) {
  const url = `${API_BASE}/calculate`;
  console.log('Fetching from:', url);
  console.log('Request data:', data);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = 'Ошибка при расчете';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
        console.error('Error response:', errorData);
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error('Error parsing response:', e);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Success response:', result);
    return result;
  } catch (error) {
    console.error('Fetch error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к серверу. Убедитесь, что backend запущен на http://localhost:8000');
    }
    throw error;
  }
}

// Case 1 - Official Irrigation Methodology API
export async function calculateCase1(data) {
  const url = `${API_BASE}/calculate/case1`;
  console.log('Fetching Case1 from:', url);
  console.log('Request data:', data);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      let errorMessage = 'Ошибка при расчете';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
        console.error('Error response:', errorData);
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error('Error parsing response:', e);
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Success Case1 response:', result);
    return result;
  } catch (error) {
    console.error('Fetch error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Не удалось подключиться к серверу. Убедитесь, что backend запущен на http://localhost:8000');
    }
    throw error;
  }
}

// Get available crops for Case 1
export async function getCase1AvailableCrops() {
  const url = `${API_BASE}/case1/available-crops`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch crops');
  }
  return response.json();
}

// Get available decades for a crop
export async function getCase1AvailableDecades(crop) {
  const url = `${API_BASE}/case1/available-decades/${crop}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch decades');
  }
  return response.json();
}

