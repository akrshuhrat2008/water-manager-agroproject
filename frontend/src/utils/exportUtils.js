import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Загружаем шрифт, поддерживающий кириллицу
const loadFont = async () => {
  // Используем встроенный шрифт для поддержки кириллицы
  // В продакшене можно добавить кастомный шрифт
  return null;
};

/**
 * Форматирование даты для экспорта
 */
const formatExportDate = (dayNumber) => {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + dayNumber - 1);

  const day = targetDate.getDate().toString().padStart(2, '0');
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const year = targetDate.getFullYear();

  return `${day}.${month}.${year}`;
};

/**
 * Получить название статуса на русском
 */
const getStatusText = (note) => {
  const statusMap = {
    heavy_rain: 'Сильный дождь',
    rain_expected: 'Дождь',
    extreme_temperature: 'Экстремальная жара',
    high_temperature: 'Жара',
    low_humidity: 'Засуха',
    high_wind: 'Ветер',
    normal: 'Норма'
  };
  return statusMap[note] || 'Норма';
};

/**
 * Получить название культуры на русском
 */
const getCropName = (crop) => {
  const cropMap = {
    cotton: 'Хлопок',
    wheat: 'Пшеница',
    vegetables: 'Овощи',
    fruits: 'Фрукты',
    rice: 'Рис',
    alfalfa: 'Люцерна',
    grain: 'Зерновые',
    orchard: 'Сады'
  };
  return cropMap[crop] || crop;
};

/**
 * Получить название фазы роста на русском
 */
const getGrowthStageName = (stage) => {
  const stageMap = {
    early: 'Ранняя',
    active: 'Активная',
    late: 'Поздняя'
  };
  return stageMap[stage] || stage;
};

/**
 * Получить название региона на русском
 */
const getRegionName = (region) => {
  const regionMap = {
    dushanbe: 'Душанбе',
    sughd: 'Согдийская область',
    khatlon: 'Хатлонская область',
    gbao: 'ГБАО'
  };
  return regionMap[region] || region;
};

/**
 * Экспорт одного участка в PDF
 */
export const exportToPDF = (result, formData) => {
  const doc = new jsPDF();

  // Заголовок документа
  doc.setFontSize(20);
  doc.text('Plan vodopolzovaniya', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  const currentDate = new Date().toLocaleDateString('ru-RU');
  doc.text(`Data: ${currentDate}`, 105, 30, { align: 'center' });

  // Информация о участке
  doc.setFontSize(14);
  doc.text('Informaciya ob uchastke', 14, 45);

  doc.setFontSize(11);
  let yPos = 55;

  doc.text(`Kultura: ${getCropName(formData.crop)}`, 14, yPos);
  yPos += 7;
  doc.text(`Faza rosta: ${getGrowthStageName(formData.growth_stage)}`, 14, yPos);
  yPos += 7;
  doc.text(`Ploschad: ${formData.area} ga`, 14, yPos);
  yPos += 7;
  doc.text(`Region: ${getRegionName(formData.region)}`, 14, yPos);
  yPos += 7;
  doc.text(`Period: ${formData.days} dnej`, 14, yPos);
  yPos += 10;

  // Итоговые данные
  doc.setFontSize(14);
  doc.text('Itogovye dannye', 14, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.text(`Obschij obem vody: ${result.total_water.toFixed(2)} m3`, 14, yPos);
  yPos += 7;
  doc.text(`Srednij obem v den: ${result.statistics.average_daily.toFixed(2)} m3`, 14, yPos);
  yPos += 7;
  doc.text(`Maksimalnyj obem v den: ${result.statistics.max_daily.toFixed(2)} m3`, 14, yPos);
  yPos += 7;
  doc.text(`Minimalnyj obem v den: ${result.statistics.min_daily.toFixed(2)} m3`, 14, yPos);
  yPos += 12;

  // Таблица ежедневного плана
  doc.setFontSize(14);
  doc.text('Plan po dnyam', 14, yPos);
  yPos += 5;

  const tableData = result.daily_plan.map((item) => [
    `Den ${item.day}`,
    formatExportDate(item.day),
    item.weather ? `${item.weather.temperature_min}...${item.weather.temperature}°C` : '-',
    item.weather && item.weather.precipitation > 0 ? `${item.weather.precipitation} mm` : '-',
    `${item.water.toFixed(2)} m3`,
    getStatusText(item.note)
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Den', 'Data', 'Temperatura', 'Osadki', 'Voda', 'Status']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 10 }
  });

  // Рекомендации на новой странице, если не помещаются
  const finalY = doc.lastAutoTable.finalY || yPos + 10;

  if (finalY > 250) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos = finalY + 15;
  }

  doc.setFontSize(14);
  doc.text('Rekomendacii', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  result.recommendations.forEach((rec, index) => {
    const lines = doc.splitTextToSize(`${index + 1}. ${rec}`, 180);
    doc.text(lines, 14, yPos);
    yPos += lines.length * 6;

    // Проверяем, не выходит ли текст за пределы страницы
    if (yPos > 280) {
      doc.addPage();
      yPos = 20;
    }
  });

  // Подпись
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos += 15;
  }

  doc.setFontSize(10);
  doc.text('_____________________', 14, yPos + 10);
  doc.text('Podpis', 14, yPos + 17);

  // Сохраняем файл
  const fileName = `plan_vodopolzovaniya_${formData.crop}_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};

/**
 * Экспорт множественных участков в PDF
 */
export const exportMultiplePlotsToPDF = (result, days) => {
  const doc = new jsPDF();

  // Заголовок
  doc.setFontSize(20);
  doc.text('Plan vodopolzovaniya', 105, 20, { align: 'center' });
  doc.text('(Mnozhestvennye uchastki)', 105, 28, { align: 'center' });

  doc.setFontSize(12);
  const currentDate = new Date().toLocaleDateString('ru-RU');
  doc.text(`Data: ${currentDate}`, 105, 38, { align: 'center' });

  // Итоговая статистика
  doc.setFontSize(14);
  doc.text('Itogovaya statistika', 14, 50);

  doc.setFontSize(11);
  let yPos = 60;
  doc.text(`Kolichestvo uchastkov: ${result.summary.total_plots}`, 14, yPos);
  yPos += 7;
  doc.text(`Obschaya ploschad: ${result.summary.total_area.toFixed(2)} ga`, 14, yPos);
  yPos += 7;
  doc.text(`Obschij obem vody: ${result.summary.total_water.toFixed(2)} m3`, 14, yPos);
  yPos += 7;
  doc.text(`Srednij rashod na 1 ga: ${result.summary.average_water_per_ha.toFixed(2)} m3/ga`, 14, yPos);
  yPos += 7;
  doc.text(`Period: ${days} dnej`, 14, yPos);
  yPos += 15;

  // Таблица участков
  doc.setFontSize(14);
  doc.text('Detalizaciya po uchastkam', 14, yPos);
  yPos += 5;

  const tableData = result.plots.map((plot, index) => [
    (index + 1).toString(),
    plot.plot_name,
    `${plot.area} ga`,
    getCropName(plot.crop),
    getGrowthStageName(plot.growth_stage),
    `${plot.total_water.toFixed(2)} m3`,
    `${plot.water_per_ha.toFixed(2)} m3/ga`
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'Nazvanie', 'Ploschad', 'Kultura', 'Faza', 'Obem vody', 'Na 1 ga']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 10 }
  });

  // Подпись
  const finalY = doc.lastAutoTable.finalY || yPos + 10;
  yPos = finalY + 20;

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(10);
  doc.text('_____________________', 14, yPos);
  doc.text('Podpis', 14, yPos + 7);

  // Сохраняем
  const fileName = `plan_vodopolzovaniya_mnozh_${new Date().getTime()}.pdf`;
  doc.save(fileName);
};

/**
 * Экспорт одного участка в Excel
 */
export const exportToExcel = (result, formData) => {
  const workbook = XLSX.utils.book_new();

  // Лист 1: Общая информация
  const infoData = [
    ['План водопользования'],
    [''],
    ['Дата создания', new Date().toLocaleDateString('ru-RU')],
    [''],
    ['Информация о участке'],
    ['Культура', getCropName(formData.crop)],
    ['Фаза роста', getGrowthStageName(formData.growth_stage)],
    ['Площадь', `${formData.area} га`],
    ['Регион', getRegionName(formData.region)],
    ['Период', `${formData.days} дней`],
    [''],
    ['Итоговые данные'],
    ['Общий объем воды', `${result.total_water.toFixed(2)} м³`],
    ['Средний объем в день', `${result.statistics.average_daily.toFixed(2)} м³`],
    ['Максимальный объем в день', `${result.statistics.max_daily.toFixed(2)} м³`],
    ['Минимальный объем в день', `${result.statistics.min_daily.toFixed(2)} м³`],
    ['Количество дождливых дней', result.statistics.rain_days],
    ['Количество жарких дней', result.statistics.high_temp_days],
  ];

  const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
  XLSX.utils.book_append_sheet(workbook, infoSheet, 'Информация');

  // Лист 2: Ежедневный план
  const dailyData = [
    ['День', 'Дата', 'Температура мин (°C)', 'Температура макс (°C)', 'Осадки (мм)', 'Ветер (м/с)', 'Влажность (%)', 'Объем воды (м³)', 'Статус']
  ];

  result.daily_plan.forEach((item) => {
    dailyData.push([
      item.day,
      formatExportDate(item.day),
      item.weather?.temperature_min || '-',
      item.weather?.temperature || '-',
      item.weather?.precipitation || 0,
      item.weather?.wind_speed || '-',
      item.weather?.humidity || '-',
      item.water.toFixed(2),
      getStatusText(item.note)
    ]);
  });

  const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);

  // Устанавливаем ширину столбцов
  dailySheet['!cols'] = [
    { wch: 8 },  // День
    { wch: 12 }, // Дата
    { wch: 18 }, // Температура мин
    { wch: 18 }, // Температура макс
    { wch: 12 }, // Осадки
    { wch: 12 }, // Ветер
    { wch: 14 }, // Влажность
    { wch: 16 }, // Объем воды
    { wch: 18 }  // Статус
  ];

  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Ежедневный план');

  // Лист 3: Рекомендации
  const recommendationsData = [
    ['№', 'Рекомендация']
  ];

  result.recommendations.forEach((rec, index) => {
    recommendationsData.push([index + 1, rec]);
  });

  const recSheet = XLSX.utils.aoa_to_sheet(recommendationsData);
  recSheet['!cols'] = [{ wch: 5 }, { wch: 100 }];
  XLSX.utils.book_append_sheet(workbook, recSheet, 'Рекомендации');

  // Сохраняем файл
  const fileName = `plan_vodopolzovaniya_${formData.crop}_${new Date().getTime()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Экспорт множественных участков в Excel
 */
export const exportMultiplePlotsToExcel = (result, days) => {
  const workbook = XLSX.utils.book_new();

  // Лист 1: Сводка
  const summaryData = [
    ['План водопользования (Множественные участки)'],
    [''],
    ['Дата создания', new Date().toLocaleDateString('ru-RU')],
    ['Период', `${days} дней`],
    [''],
    ['Итоговая статистика'],
    ['Количество участков', result.summary.total_plots],
    ['Общая площадь', `${result.summary.total_area.toFixed(2)} га`],
    ['Общий объем воды', `${result.summary.total_water.toFixed(2)} м³`],
    ['Средний расход на 1 га', `${result.summary.average_water_per_ha.toFixed(2)} м³/га`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');

  // Лист 2: Детализация по участкам
  const plotsData = [
    ['№', 'Название', 'Площадь (га)', 'Культура', 'Фаза роста', 'Регион', 'Объем воды (м³)', 'Расход на 1 га (м³/га)']
  ];

  result.plots.forEach((plot, index) => {
    plotsData.push([
      index + 1,
      plot.plot_name,
      plot.area,
      getCropName(plot.crop),
      getGrowthStageName(plot.growth_stage),
      getRegionName(plot.region),
      plot.total_water.toFixed(2),
      plot.water_per_ha.toFixed(2)
    ]);
  });

  const plotsSheet = XLSX.utils.aoa_to_sheet(plotsData);
  plotsSheet['!cols'] = [
    { wch: 5 },  // №
    { wch: 20 }, // Название
    { wch: 14 }, // Площадь
    { wch: 15 }, // Культура
    { wch: 14 }, // Фаза роста
    { wch: 20 }, // Регион
    { wch: 18 }, // Объем воды
    { wch: 20 }  // Расход на 1 га
  ];

  XLSX.utils.book_append_sheet(workbook, plotsSheet, 'Участки');

  // Сохраняем
  const fileName = `plan_vodopolzovaniya_mnozh_${new Date().getTime()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
