import { For } from 'solid-js';
import { CloudRain, Thermometer, Check, Droplets, Wind, Sun, AlertTriangle } from 'lucide-solid';

function DailyPlanTable(props) {
  const formatDate = (dayNumber) => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayNumber - 1);

    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

    const dayName = days[targetDate.getDay()];
    const day = targetDate.getDate();
    const month = months[targetDate.getMonth()];

    return {
      full: `${dayName}, ${day} ${month}`,
      short: `${day} ${month}`,
      dayName: dayName
    };
  };

  const getBadgeClass = (note) => {
    switch (note) {
      case 'heavy_rain':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800';
      case 'rain_expected':
        return 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800';
      case 'extreme_temperature':
        return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800';
      case 'high_temperature':
        return 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800';
      case 'low_humidity':
        return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800';
      case 'high_wind':
        return 'bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800';
      default:
        return 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800';
    }
  };

  const getBadgeContent = (note) => {
    switch (note) {
      case 'heavy_rain':
        return { icon: CloudRain, text: 'Сильный дождь' };
      case 'rain_expected':
        return { icon: CloudRain, text: 'Дождь' };
      case 'extreme_temperature':
        return { icon: AlertTriangle, text: 'Экстрим жара' };
      case 'high_temperature':
        return { icon: Thermometer, text: 'Жара' };
      case 'low_humidity':
        return { icon: Sun, text: 'Засуха' };
      case 'high_wind':
        return { icon: Wind, text: 'Ветер' };
      default:
        return { icon: Check, text: 'Норма' };
    }
  };

  return (
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="min-w-full divide-y divide-border">
        <thead class="bg-muted">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Дата
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Погода
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Объем воды (м³)
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Статус
            </th>
          </tr>
        </thead>
        <tbody class="bg-card divide-y divide-border">
          <For each={props.dailyPlan}>
            {(item) => {
              const badge = getBadgeContent(item.note);
              const BadgeIcon = badge.icon;
              const dateInfo = formatDate(item.day);

              return (
                <tr class="hover:bg-muted/50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-semibold">День {item.day}</div>
                    <div class="text-sm text-muted-foreground">{dateInfo.short}</div>
                    <div class="text-xs text-muted-foreground">{dateInfo.dayName}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="space-y-1">
                      {item.weather && (
                        <>
                          <div class="flex items-center gap-2 text-sm font-medium">
                            <Thermometer size={14} class="text-orange-500" />
                            {item.weather.temperature_min !== undefined ? (
                              <span>
                                <span class="text-blue-600 dark:text-blue-400">{item.weather.temperature_min}°C</span>
                                <span class="text-muted-foreground mx-1">...</span>
                                <span class="text-orange-600 dark:text-orange-400">{item.weather.temperature}°C</span>
                                <span class="text-xs text-muted-foreground ml-1">(макс)</span>
                              </span>
                            ) : (
                              <span>{item.weather.temperature}°C</span>
                            )}
                          </div>
                          {item.weather.precipitation !== undefined && item.weather.precipitation > 0 && (
                            <div class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                              <CloudRain size={14} class="text-blue-500" />
                              <span>{item.weather.precipitation.toFixed(1)} мм</span>
                            </div>
                          )}
                          {item.weather.wind_speed !== undefined && (
                            <div class="flex items-center gap-2 text-sm text-muted-foreground">
                              <Wind size={14} class="text-gray-500" />
                              <span>{item.weather.wind_speed.toFixed(1)} м/с</span>
                            </div>
                          )}
                          {item.weather.humidity !== undefined && (
                            <div class="flex items-center gap-2 text-sm text-muted-foreground">
                              <Droplets size={14} class="text-cyan-500" />
                              <span>{item.weather.humidity}%</span>
                            </div>
                          )}
                        </>
                      )}
                      {!item.weather && (
                        <div class="text-sm text-muted-foreground">Нет данных</div>
                      )}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-bold text-lg text-blue-600 dark:text-blue-400">
                      {item.water.toFixed(2)} м³
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class={`px-3 py-1 inline-flex items-center gap-1.5 text-xs leading-5 font-semibold rounded-full ${getBadgeClass(item.note)}`}>
                      <BadgeIcon size={14} />
                      {badge.text}
                    </span>
                  </td>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </div>
  );
}

export default DailyPlanTable;

