import { createSignal, For, Show, createEffect } from 'solid-js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Label } from './ui/Label';
import { Input } from './ui/Input';
import { Calculator, Info } from 'lucide-solid';
import { getCase1AvailableDecades } from '../api/waterApi';

export default function Case1Form(props) {
  const [area, setArea] = createSignal(100);
  const [crop, setCrop] = createSignal('cotton');
  const [planningPeriod, setPlanningPeriod] = createSignal('month');
  const [month, setMonth] = createSignal('april');
  const [selectedDecades, setSelectedDecades] = createSignal([]);
  const [availableDecades, setAvailableDecades] = createSignal([]);

  // Культуры
  const crops = [
    { value: 'cotton', label: '🌾 Хлопок' },
    { value: 'alfalfa', label: '🌿 Люцерна' },
    { value: 'grain', label: '🌾 Зерновые' },
    { value: 'orchard', label: '🍎 Садовые культуры' },
  ];

  // Периоды планирования
  const periods = [
    { value: 'season', label: 'Весь сезон' },
    { value: 'month', label: 'Месяц' },
    { value: 'decade', label: 'Декады (выбрать)' },
  ];

  // Месяцы
  const months = [
    { value: 'march', label: 'Март' },
    { value: 'april', label: 'Апрель' },
    { value: 'may', label: 'Май' },
    { value: 'june', label: 'Июнь' },
    { value: 'july', label: 'Июль' },
    { value: 'august', label: 'Август' },
    { value: 'september', label: 'Сентябрь' },
    { value: 'october', label: 'Октябрь' },
  ];

  // Загружаем доступные декады при изменении культуры
  createEffect(async () => {
    const currentCrop = crop();
    try {
      const data = await getCase1AvailableDecades(currentCrop);
      setAvailableDecades(data.decades || []);
    } catch (error) {
      console.error('Failed to fetch decades:', error);
      setAvailableDecades([]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      area: parseFloat(area()),
      crop: crop(),
      planning_period: planningPeriod(),
      hydromodule_zone: 'NGM-III',
    };

    // Добавляем month если период = month
    if (planningPeriod() === 'month') {
      formData.month = month();
    }

    // Добавляем decades если период = decade
    if (planningPeriod() === 'decade') {
      formData.decades = selectedDecades();
    }

    console.log('Submitting Case1 form:', formData);
    props.onSubmit(formData);
  };

  const toggleDecade = (decadeKey) => {
    const current = selectedDecades();
    if (current.includes(decadeKey)) {
      setSelectedDecades(current.filter(d => d !== decadeKey));
    } else {
      setSelectedDecades([...current, decadeKey]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Calculator class="w-5 h-5" />
          Case 1: Официальная методика РТ
        </CardTitle>
        <CardDescription>
          Планирование водопользования по гидромодулю NGM-III
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div class="flex items-start gap-2">
            <Info class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p class="text-sm text-blue-800 dark:text-blue-200">
              Расчет по официальной методике Таджикистана. Без погодных данных, только нормативы.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} class="space-y-4">
          {/* Площадь */}
          <div class="space-y-2">
            <Label for="area">Площадь (га)</Label>
            <Input
              id="area"
              type="number"
              min="0.1"
              step="0.1"
              value={area()}
              onInput={(e) => setArea(e.target.value)}
              required
            />
          </div>

          {/* Культура */}
          <div class="space-y-2">
            <Label for="crop">Культура</Label>
            <select
              id="crop"
              value={crop()}
              onChange={(e) => setCrop(e.target.value)}
              class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <For each={crops}>
                {(cropOption) => (
                  <option value={cropOption.value}>{cropOption.label}</option>
                )}
              </For>
            </select>
          </div>

          {/* Период планирования */}
          <div class="space-y-2">
            <Label for="period">Период планирования</Label>
            <select
              id="period"
              value={planningPeriod()}
              onChange={(e) => setPlanningPeriod(e.target.value)}
              class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <For each={periods}>
                {(period) => (
                  <option value={period.value}>{period.label}</option>
                )}
              </For>
            </select>
          </div>

          {/* Месяц (если период = month) */}
          <Show when={planningPeriod() === 'month'}>
            <div class="space-y-2">
              <Label for="month">Месяц</Label>
              <select
                id="month"
                value={month()}
                onChange={(e) => setMonth(e.target.value)}
                class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <For each={months}>
                  {(monthOption) => (
                    <option value={monthOption.value}>{monthOption.label}</option>
                  )}
                </For>
              </select>
            </div>
          </Show>

          {/* Декады (если период = decade) */}
          <Show when={planningPeriod() === 'decade'}>
            <div class="space-y-2">
              <Label>Выберите декады</Label>
              <div class="border rounded-lg p-3 max-h-60 overflow-y-auto bg-white dark:bg-gray-900">
                <Show when={availableDecades().length > 0} fallback={<p class="text-sm text-gray-500">Загрузка...</p>}>
                  <div class="space-y-2">
                    <For each={availableDecades()}>
                      {(decade) => (
                        <label class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedDecades().includes(decade.decade)}
                            onChange={() => toggleDecade(decade.decade)}
                            class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span class="text-sm">
                            {decade.decade_name} ({decade.irrigation_days} дней полива)
                          </span>
                        </label>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
              <Show when={selectedDecades().length > 0}>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Выбрано декад: {selectedDecades().length}
                </p>
              </Show>
            </div>
          </Show>

          {/* Кнопка расчета */}
          <Button
            type="submit"
            class="w-full"
            disabled={planningPeriod() === 'decade' && selectedDecades().length === 0}
          >
            <Calculator class="w-4 h-4 mr-2" />
            Рассчитать план водопользования
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}