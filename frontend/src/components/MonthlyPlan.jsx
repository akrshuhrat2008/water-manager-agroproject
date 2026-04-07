import { createSignal, For, Show } from 'solid-js';
import { calculateWater } from '../api/waterApi';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import {
  Calendar as CalendarIcon,
  Droplet,
  TrendingUp,
  BarChart3,
  CloudRain,
  Sun,
  Wind,
  Thermometer
} from 'lucide-solid';
import { showToast } from './ui/Toast';
import Loading from './Loading';

function MonthlyPlan() {
  const [formData, setFormData] = createSignal({
    area: '',
    crop: '',
    growth_stage: '',
    region: '',
    irrigation_type: 'default'
  });

  const [loading, setLoading] = createSignal(false);
  const [result, setResult] = createSignal(null);

  const updateFormData = (field, value) => {
    setFormData({ ...formData(), [field]: value });
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = formData();
      const response = await calculateWater({
        area: parseFloat(data.area),
        crop: data.crop,
        growth_stage: data.growth_stage,
        days: 10, // Максимум 10 дней по API
        region: data.region,
        irrigation_type: data.irrigation_type
      });

      setResult(response);
      showToast({
        title: 'Расчет выполнен',
        description: 'Месячный план успешно рассчитан',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Ошибка',
        description: error.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Функция для группировки дней по неделям
  const groupByWeeks = (dailyPlan) => {
    const weeks = [];
    for (let i = 0; i < dailyPlan.length; i += 7) {
      weeks.push(dailyPlan.slice(i, i + 7));
    }
    return weeks;
  };

  // Форматирование даты для календаря
  const formatCalendarDate = (dayNumber) => {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayNumber - 1);
    return targetDate;
  };

  const getDayName = (date) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  };

  const getStatusColor = (note) => {
    switch (note) {
      case 'heavy_rain':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'rain_expected':
        return 'bg-sky-400 dark:bg-sky-500';
      case 'extreme_temperature':
        return 'bg-red-500 dark:bg-red-600';
      case 'high_temperature':
        return 'bg-orange-500 dark:bg-orange-600';
      case 'low_humidity':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'high_wind':
        return 'bg-gray-500 dark:bg-gray-600';
      default:
        return 'bg-green-500 dark:bg-green-600';
    }
  };

  return (
    <div class="space-y-6">
      {/* Header Info Card */}
      <div class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
        <div class="flex items-start gap-4">
          <div class="bg-indigo-500 dark:bg-indigo-600 p-3 rounded-lg">
            <CalendarIcon size={32} class="text-white" />
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
              План на месяц
            </h2>
            <p class="text-indigo-700 dark:text-indigo-300 text-sm">
              Долгосрочное планирование водопользования с учетом прогноза погоды.
              Получите детальный календарь полива на 10 дней вперед.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <TrendingUp size={20} />
            Параметры расчета
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label for="area" class="mb-2 block">Площадь (га)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  placeholder="0.0"
                  value={formData().area}
                  onInput={(e) => updateFormData('area', e.target.value)}
                  class="h-11"
                />
              </div>

              <div>
                <Label for="crop" class="mb-2 block">Культура</Label>
                <select
                  id="crop"
                  required
                  class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData().crop}
                  onChange={(e) => updateFormData('crop', e.target.value)}
                >
                  <option value="">Выберите культуру</option>
                  <option value="cotton">Хлопок</option>
                  <option value="alfalfa">Люцерна</option>
                  <option value="grain">Зерновые</option>
                  <option value="orchard">Сады</option>
                </select>
              </div>

              <div>
                <Label for="growth_stage" class="mb-2 block">Фаза роста</Label>
                <select
                  id="growth_stage"
                  required
                  class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData().growth_stage}
                  onChange={(e) => updateFormData('growth_stage', e.target.value)}
                >
                  <option value="">Выберите фазу</option>
                  <option value="early">Ранняя</option>
                  <option value="active">Активная</option>
                  <option value="late">Поздняя</option>
                </select>
              </div>

              <div>
                <Label for="region" class="mb-2 block">Регион</Label>
                <select
                  id="region"
                  required
                  class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData().region}
                  onChange={(e) => updateFormData('region', e.target.value)}
                >
                  <option value="">Выберите регион</option>
                  <option value="dushanbe">Душанбе</option>
                  <option value="sughd">Согд</option>
                  <option value="khatlon">Хатлон</option>
                  <option value="gbao">ГБАО</option>
                </select>
              </div>

              <div>
                <Label for="irrigation_type" class="mb-2 block">Система полива</Label>
                <select
                  id="irrigation_type"
                  class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData().irrigation_type}
                  onChange={(e) => updateFormData('irrigation_type', e.target.value)}
                >
                  <option value="default">По умолчанию</option>
                  <option value="drip">Капельный</option>
                  <option value="sprinkler">Дождевание</option>
                  <option value="surface">Поверхностный</option>
                  <option value="furrow">Борозды</option>
                </select>
              </div>
            </div>

            <div class="pt-2">
              <Button
                type="submit"
                class="w-full h-12 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                disabled={loading()}
              >
                <Show when={!loading()} fallback={<span>Расчет...</span>}>
                  <CalendarIcon size={20} class="mr-2" />
                  Рассчитать месячный план
                </Show>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      <Loading show={loading()} />

      {/* Results */}
      <Show when={result()}>
        <div class="space-y-6 animate-fade-in">
          {/* Summary Stats */}
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card class="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
              <CardContent class="p-6">
                <div class="flex items-center gap-3 mb-2">
                  <Droplet size={24} class="text-blue-600 dark:text-blue-400" />
                  <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">Общий объем</div>
                </div>
                <div class="text-3xl font-bold text-blue-800 dark:text-blue-200">
                  {result().total_water.toFixed(0)}
                  <span class="text-lg ml-1">м³</span>
                </div>
              </CardContent>
            </Card>

            <Card class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
              <CardContent class="p-6">
                <div class="flex items-center gap-3 mb-2">
                  <TrendingUp size={24} class="text-green-600 dark:text-green-400" />
                  <div class="text-sm text-green-600 dark:text-green-400 font-medium">Средний в день</div>
                </div>
                <div class="text-3xl font-bold text-green-800 dark:text-green-200">
                  {result().statistics.average_daily.toFixed(0)}
                  <span class="text-lg ml-1">м³</span>
                </div>
              </CardContent>
            </Card>

            <Card class="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
              <CardContent class="p-6">
                <div class="flex items-center gap-3 mb-2">
                  <BarChart3 size={24} class="text-orange-600 dark:text-orange-400" />
                  <div class="text-sm text-orange-600 dark:text-orange-400 font-medium">Макс. в день</div>
                </div>
                <div class="text-3xl font-bold text-orange-800 dark:text-orange-200">
                  {result().statistics.max_daily.toFixed(0)}
                  <span class="text-lg ml-1">м³</span>
                </div>
              </CardContent>
            </Card>

            <Card class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
              <CardContent class="p-6">
                <div class="flex items-center gap-3 mb-2">
                  <CloudRain size={24} class="text-purple-600 dark:text-purple-400" />
                  <div class="text-sm text-purple-600 dark:text-purple-400 font-medium">Дней с дождем</div>
                </div>
                <div class="text-3xl font-bold text-purple-800 dark:text-purple-200">
                  {result().statistics.rain_days}
                  <span class="text-lg ml-1">дн</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar View */}
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <CalendarIcon size={24} />
                Календарь полива
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-6">
                <For each={groupByWeeks(result().daily_plan)}>
                  {(week, weekIndex) => (
                    <div class="space-y-2">
                      <div class="text-sm font-semibold text-muted-foreground">
                        Неделя {weekIndex() + 1}
                      </div>
                      <div class="grid grid-cols-7 gap-2">
                        <For each={week}>
                          {(day) => {
                            const date = formatCalendarDate(day.day);
                            const dayName = getDayName(date);
                            const statusColor = getStatusColor(day.note);

                            return (
                              <div class={`p-4 rounded-lg border-2 hover:shadow-lg transition-all ${
                                day.note === 'heavy_rain' || day.note === 'rain_expected'
                                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50'
                                  : day.note === 'extreme_temperature' || day.note === 'high_temperature'
                                  ? 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/50'
                                  : 'border-border bg-card'
                              }`}>
                                <div class="space-y-2">
                                  <div class="flex items-center justify-between">
                                    <div class="text-xs font-medium text-muted-foreground">{dayName}</div>
                                    <div class={`w-3 h-3 rounded-full ${statusColor}`}></div>
                                  </div>
                                  <div class="text-lg font-bold">{date.getDate()}</div>
                                  <div class="text-xs text-muted-foreground">
                                    {day.weather?.temperature_min !== undefined ? (
                                      <div class="flex items-center gap-1">
                                        <Thermometer size={12} />
                                        <span>{day.weather.temperature_min}°...{day.weather.temperature}°</span>
                                      </div>
                                    ) : null}
                                  </div>
                                  <div class="pt-2 border-t border-border">
                                    <div class="text-sm font-bold text-blue-600 dark:text-blue-400">
                                      {day.water.toFixed(1)} м³
                                    </div>
                                  </div>
                                  <Show when={day.weather?.precipitation > 0}>
                                    <div class="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                      <CloudRain size={12} />
                                      <span>{day.weather.precipitation.toFixed(1)} мм</span>
                                    </div>
                                  </Show>
                                </div>
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Недельная сводка</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-border">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Неделя</th>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Период</th>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Объем воды</th>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Средний в день</th>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Дней с дождем</th>
                    </tr>
                  </thead>
                  <tbody class="bg-card divide-y divide-border">
                    <For each={groupByWeeks(result().daily_plan)}>
                      {(week, weekIndex) => {
                        const weekWater = week.reduce((sum, day) => sum + day.water, 0);
                        const avgDaily = weekWater / week.length;
                        const rainDays = week.filter(day =>
                          day.note === 'heavy_rain' || day.note === 'rain_expected'
                        ).length;
                        const startDate = formatCalendarDate(week[0].day);
                        const endDate = formatCalendarDate(week[week.length - 1].day);

                        return (
                          <tr class="hover:bg-muted/50">
                            <td class="px-6 py-4 font-semibold">Неделя {weekIndex() + 1}</td>
                            <td class="px-6 py-4 text-sm">
                              {startDate.getDate()}.{startDate.getMonth() + 1} - {endDate.getDate()}.{endDate.getMonth() + 1}
                            </td>
                            <td class="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">
                              {weekWater.toFixed(2)} м³
                            </td>
                            <td class="px-6 py-4">{avgDaily.toFixed(2)} м³/день</td>
                            <td class="px-6 py-4">{rainDays} дн</td>
                          </tr>
                        );
                      }}
                    </For>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </Show>
    </div>
  );
}

export default MonthlyPlan;
