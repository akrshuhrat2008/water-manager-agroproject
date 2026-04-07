import { createSignal, For, Show } from 'solid-js';
import { calculateWater } from '../api/waterApi';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Plus, Trash2, GitCompare, Droplet, TrendingUp, BarChart3 } from 'lucide-solid';
import { showToast } from './ui/Toast';
import Loading from './Loading';

function Scenarios() {
  const [baseParams, setBaseParams] = createSignal({
    area: '',
    region: '',
    days: 7
  });

  const [scenarios, setScenarios] = createSignal([
    { name: 'Сценарий 1', crop: '', growth_stage: '', irrigation_type: 'default' },
    { name: 'Сценарий 2', crop: '', growth_stage: '', irrigation_type: 'default' }
  ]);

  const [loading, setLoading] = createSignal(false);
  const [results, setResults] = createSignal(null);

  const addScenario = () => {
    setScenarios([...scenarios(), {
      name: `Сценарий ${scenarios().length + 1}`,
      crop: '',
      growth_stage: '',
      irrigation_type: 'default'
    }]);
  };

  const removeScenario = (index) => {
    const newScenarios = scenarios().filter((_, i) => i !== index);
    if (newScenarios.length >= 2) {
      setScenarios(newScenarios);
    }
  };

  const updateScenario = (index, field, value) => {
    const newScenarios = [...scenarios()];
    newScenarios[index][field] = value;
    setScenarios(newScenarios);
  };

  const updateBaseParam = (field, value) => {
    setBaseParams({ ...baseParams(), [field]: value });
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const base = baseParams();
      const scenarioPromises = scenarios().map(scenario =>
        calculateWater({
          area: parseFloat(base.area),
          crop: scenario.crop,
          growth_stage: scenario.growth_stage,
          days: base.days,
          region: base.region,
          irrigation_type: scenario.irrigation_type
        })
      );

      const scenarioResults = await Promise.all(scenarioPromises);

      setResults({
        scenarios: scenarios().map((s, i) => ({
          ...s,
          result: scenarioResults[i]
        }))
      });

      showToast({
        title: 'Сравнение выполнено',
        description: `Сравнено ${scenarios().length} сценариев`,
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

  return (
    <div class="space-y-6">
      {/* Header Info Card */}
      <div class="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-slate-900 dark:via-purple-950 dark:to-pink-950 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div class="flex items-start gap-4">
          <div class="bg-purple-500 dark:bg-purple-600 p-3 rounded-lg">
            <GitCompare size={32} class="text-white" />
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-2">
              Сравнение сценариев
            </h2>
            <p class="text-purple-700 dark:text-purple-300 text-sm">
              Сравните разные варианты культур, фаз роста и систем полива для одного участка.
              Определите оптимальный вариант с минимальным расходом воды.
            </p>
          </div>
        </div>
      </div>

      {/* Base Parameters Card */}
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <TrendingUp size={20} />
            Общие параметры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCompare} class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <Label for="area" class="mb-2 block">Площадь (га)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  placeholder="0.0"
                  value={baseParams().area}
                  onInput={(e) => updateBaseParam('area', e.target.value)}
                  class="h-11"
                />
              </div>

              <div>
                <Label for="region" class="mb-2 block">Регион</Label>
                <select
                  id="region"
                  required
                  class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={baseParams().region}
                  onChange={(e) => updateBaseParam('region', e.target.value)}
                >
                  <option value="">Выберите регион</option>
                  <option value="dushanbe">Душанбе</option>
                  <option value="sughd">Согд</option>
                  <option value="khatlon">Хатлон</option>
                  <option value="gbao">ГБАО</option>
                </select>
              </div>

              <div>
                <Label for="days" class="mb-2 block">Период планирования</Label>
                <select
                  id="days"
                  class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={baseParams().days}
                  onChange={(e) => updateBaseParam('days', parseInt(e.target.value))}
                >
                  <option value="7">7 дней</option>
                  <option value="10">10 дней</option>
                </select>
              </div>
            </div>

            {/* Scenarios List */}
            <div class="space-y-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-semibold">Сценарии для сравнения</h3>
                <span class="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Всего: {scenarios().length}
                </span>
              </div>

              <For each={scenarios()}>
                {(scenario, index) => (
                  <Card class="border-2 border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-sm hover:shadow-md">
                    <CardContent class="p-5 space-y-4">
                      <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-3">
                          <div class="bg-gradient-to-br from-purple-500 to-pink-500 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
                            {index() + 1}
                          </div>
                          <Input
                            type="text"
                            placeholder="Название сценария"
                            value={scenario.name}
                            onInput={(e) => updateScenario(index(), 'name', e.target.value)}
                            class="h-9 font-semibold text-lg max-w-xs"
                          />
                        </div>
                        <Show when={scenarios().length > 2}>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeScenario(index())}
                          >
                            <Trash2 size={16} class="mr-1" />
                            Удалить
                          </Button>
                        </Show>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label class="mb-2 block">Культура</Label>
                          <select
                            required
                            class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={scenario.crop}
                            onChange={(e) => updateScenario(index(), 'crop', e.target.value)}
                          >
                            <option value="">Выберите культуру</option>
                            <option value="cotton">Хлопок</option>
                            <option value="alfalfa">Люцерна</option>
                            <option value="grain">Зерновые</option>
                            <option value="orchard">Сады</option>
                          </select>
                        </div>

                        <div>
                          <Label class="mb-2 block">Фаза роста</Label>
                          <select
                            required
                            class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={scenario.growth_stage}
                            onChange={(e) => updateScenario(index(), 'growth_stage', e.target.value)}
                          >
                            <option value="">Выберите фазу</option>
                            <option value="early">Ранняя</option>
                            <option value="active">Активная</option>
                            <option value="late">Поздняя</option>
                          </select>
                        </div>

                        <div>
                          <Label class="mb-2 block">Система полива</Label>
                          <select
                            class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            value={scenario.irrigation_type}
                            onChange={(e) => updateScenario(index(), 'irrigation_type', e.target.value)}
                          >
                            <option value="default">По умолчанию</option>
                            <option value="drip">Капельный</option>
                            <option value="sprinkler">Дождевание</option>
                            <option value="surface">Поверхностный</option>
                            <option value="furrow">Борозды</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </For>
            </div>

            {/* Add Scenario Button */}
            <Button
              type="button"
              variant="outline"
              class="w-full border-2 border-dashed border-purple-300 dark:border-purple-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950 h-14 text-base font-medium transition-all"
              onClick={addScenario}
            >
              <Plus size={20} class="mr-2" />
              Добавить сценарий
            </Button>

            {/* Compare Button */}
            <div class="pt-2">
              <Button
                type="submit"
                class="w-full h-14 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                disabled={loading()}
              >
                <Show when={!loading()} fallback={<span>Сравнение...</span>}>
                  <GitCompare size={20} class="mr-2" />
                  Сравнить сценарии
                </Show>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      <Loading show={loading()} />

      {/* Results */}
      <Show when={results()}>
        <div class="space-y-4 animate-fade-in">
          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <BarChart3 size={24} />
                Сравнительная таблица
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-border">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Параметр
                      </th>
                      <For each={results().scenarios}>
                        {(scenario) => (
                          <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                            {scenario.name}
                          </th>
                        )}
                      </For>
                    </tr>
                  </thead>
                  <tbody class="bg-card divide-y divide-border">
                    <tr class="hover:bg-muted/50">
                      <td class="px-6 py-4 font-semibold">Культура</td>
                      <For each={results().scenarios}>
                        {(scenario) => (
                          <td class="px-6 py-4">
                            {scenario.crop === 'cotton' ? 'Хлопок' :
                             scenario.crop === 'alfalfa' ? 'Люцерна' :
                             scenario.crop === 'grain' ? 'Зерновые' : 'Сады'}
                          </td>
                        )}
                      </For>
                    </tr>
                    <tr class="hover:bg-muted/50">
                      <td class="px-6 py-4 font-semibold">Фаза роста</td>
                      <For each={results().scenarios}>
                        {(scenario) => (
                          <td class="px-6 py-4">
                            {scenario.growth_stage === 'early' ? 'Ранняя' :
                             scenario.growth_stage === 'active' ? 'Активная' : 'Поздняя'}
                          </td>
                        )}
                      </For>
                    </tr>
                    <tr class="hover:bg-muted/50">
                      <td class="px-6 py-4 font-semibold">Система полива</td>
                      <For each={results().scenarios}>
                        {(scenario) => (
                          <td class="px-6 py-4">
                            {scenario.irrigation_type === 'drip' ? 'Капельный' :
                             scenario.irrigation_type === 'sprinkler' ? 'Дождевание' :
                             scenario.irrigation_type === 'surface' ? 'Поверхностный' :
                             scenario.irrigation_type === 'furrow' ? 'Борозды' : 'По умолчанию'}
                          </td>
                        )}
                      </For>
                    </tr>
                    <tr class="bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900">
                      <td class="px-6 py-4 font-bold text-blue-800 dark:text-blue-200">
                        Общий объем воды (м³)
                      </td>
                      <For each={results().scenarios}>
                        {(scenario) => (
                          <td class="px-6 py-4 font-bold text-lg text-blue-600 dark:text-blue-400">
                            {scenario.result.total_water.toFixed(2)} м³
                          </td>
                        )}
                      </For>
                    </tr>
                    <tr class="hover:bg-muted/50">
                      <td class="px-6 py-4 font-semibold">Средний расход в день</td>
                      <For each={results().scenarios}>
                        {(scenario) => (
                          <td class="px-6 py-4">
                            {scenario.result.statistics.average_daily.toFixed(2)} м³/день
                          </td>
                        )}
                      </For>
                    </tr>
                    <tr class="hover:bg-muted/50">
                      <td class="px-6 py-4 font-semibold">Макс. расход в день</td>
                      <For each={results().scenarios}>
                        {(scenario) => (
                          <td class="px-6 py-4">
                            {scenario.result.statistics.max_daily.toFixed(2)} м³
                          </td>
                        )}
                      </For>
                    </tr>
                    <tr class="hover:bg-muted/50">
                      <td class="px-6 py-4 font-semibold">Дней с дождем</td>
                      <For each={results().scenarios}>
                        {(scenario) => (
                          <td class="px-6 py-4">
                            {scenario.result.statistics.rain_days}
                          </td>
                        )}
                      </For>
                    </tr>
                    <tr class="hover:bg-muted/50">
                      <td class="px-6 py-4 font-semibold">Эффективность полива</td>
                      <For each={results().scenarios}>
                        {(scenario) => (
                          <td class="px-6 py-4">
                            {scenario.result.irrigation_efficiency !== undefined && !isNaN(scenario.result.irrigation_efficiency)
                              ? (scenario.result.irrigation_efficiency * 100).toFixed(0) + '%'
                              : '—'}
                          </td>
                        )}
                      </For>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Best Option Card */}
          <Card class="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border-2 border-green-300 dark:border-green-700 shadow-lg">
            <CardHeader>
              <CardTitle class="text-green-800 dark:text-green-300 flex items-center gap-2">
                <Droplet size={24} />
                Рекомендация
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const minWaterScenario = results().scenarios.reduce((min, curr) =>
                  curr.result.total_water < min.result.total_water ? curr : min
                );
                return (
                  <div class="space-y-3">
                    <p class="text-green-700 dark:text-green-300 text-lg font-semibold">
                      Оптимальный вариант: <span class="text-green-900 dark:text-green-100">{minWaterScenario.name}</span>
                    </p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div class="bg-white/60 dark:bg-slate-900/60 p-4 rounded-lg">
                        <div class="text-sm text-green-600 dark:text-green-400 mb-1">Общий объем</div>
                        <div class="text-2xl font-bold text-green-800 dark:text-green-200">
                          {minWaterScenario.result.total_water.toFixed(0)} м³
                        </div>
                      </div>
                      <div class="bg-white/60 dark:bg-slate-900/60 p-4 rounded-lg">
                        <div class="text-sm text-green-600 dark:text-green-400 mb-1">Культура</div>
                        <div class="text-lg font-bold text-green-800 dark:text-green-200">
                          {minWaterScenario.crop === 'cotton' ? 'Хлопок' :
                           minWaterScenario.crop === 'alfalfa' ? 'Люцерна' :
                           minWaterScenario.crop === 'grain' ? 'Зерновые' : 'Сады'}
                        </div>
                      </div>
                      <div class="bg-white/60 dark:bg-slate-900/60 p-4 rounded-lg">
                        <div class="text-sm text-green-600 dark:text-green-400 mb-1">Фаза</div>
                        <div class="text-lg font-bold text-green-800 dark:text-green-200">
                          {minWaterScenario.growth_stage === 'early' ? 'Ранняя' :
                           minWaterScenario.growth_stage === 'active' ? 'Активная' : 'Поздняя'}
                        </div>
                      </div>
                      <div class="bg-white/60 dark:bg-slate-900/60 p-4 rounded-lg">
                        <div class="text-sm text-green-600 dark:text-green-400 mb-1">Эффективность</div>
                        <div class="text-lg font-bold text-green-800 dark:text-green-200">
                          {minWaterScenario.result.irrigation_efficiency !== undefined && !isNaN(minWaterScenario.result.irrigation_efficiency)
                            ? (minWaterScenario.result.irrigation_efficiency * 100).toFixed(0) + '%'
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </Show>
    </div>
  );
}

export default Scenarios;
