const API_BASE = '/api';

async function downloadFile(url, filename, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Ошибка при экспорте');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

export async function exportToExcel(data) {
  await downloadFile(`${API_BASE}/export/excel`, 'water_plan.xlsx', data);
}

export async function exportToPdf(data) {
  await downloadFile(`${API_BASE}/export/pdf`, 'water_plan.pdf', data);
}

