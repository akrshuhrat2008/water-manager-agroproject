import { createSignal, For, Show } from 'solid-js';
import { calculateMultiplePlots } from '../api/extendedApi';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Plus, Trash2, Layers, Droplet, MapPin, Sprout, TrendingUp } from 'lucide-solid';
import { showToast } from './ui/Toast';
import Loading from './Loading';

function MultiplePlots() {
  const [plots, setPlots] = createSignal([{ plot_name: '', area: '', crop: '', growth_stage: '', region: '' }]);
  const [days, setDays] = createSignal(7);
  const [loading, setLoading] = createSignal(false);
  const [result, setResult] = createSignal(null);

  const addPlot = () => {
    setPlots([...plots(), { plot_name: '', area: '', crop: '', growth_stage: '', region: '' }]);
  };

  const removePlot = (index) => {
    const newPlots = plots().filter((_, i) => i !== index);
    if (newPlots.length > 0) {
      setPlots(newPlots);
    }
  };

  const updatePlot = (index, field, value) => {
    const newPlots = [...plots()];
    newPlots[index][field] = value;
    setPlots(newPlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const plotsData = plots().map(p => ({
        plot_name: p.plot_name || `Участок ${plots().indexOf(p) + 1}`,
        area: parseFloat(p.area),
        crop: p.crop,
        growth_stage: p.growth_stage,
        region: p.region
      }));

      const response = await calculateMultiplePlots({ plots: plotsData, days: days() });
      setResult(response);
      showToast({
        title: 'Расчет выполнен',
        description: `Успешно рассчитано ${plotsData.length} участков`,
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
      <div class="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-slate-900 dark:via-blue-950 dark:to-cyan-950 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div class="flex items-start gap-4">
          <div class="bg-blue-500 dark:bg-blue-600 p-3 rounded-lg">
            <Layers size={32} class="text-white" />
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              Множественные участки
            </h2>
            <p class="text-blue-700 dark:text-blue-300 text-sm">
              Рассчитайте план водопользования для нескольких участков одновременно.
              Система автоматически суммирует все данные и покажет общий расход воды.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <TrendingUp size={20} />
            Настройки расчета
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} class="space-y-6">
            <div class="bg-muted/50 p-4 rounded-lg">
              <Label for="days" class="text-base font-semibold mb-3 block">
                Период планирования
              </Label>
              <select
                id="days"
                class="flex h-12 w-full items-center justify-between rounded-lg border-2 border-input bg-background px-4 py-2 text-base font-medium ring-offset-background focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
                value={days()}
                onChange={(e) => setDays(parseInt(e.target.value))}
              >
                <option value="7">7 дней</option>
                <option value="10">10 дней</option>
                <option value="30">30 дней</option>
              </select>
            </div>

            {/* Plots List */}
            <div class="space-y-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-lg font-semibold">Список участков</h3>
                <span class="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  Всего: {plots().length}
                </span>
              </div>

              <For each={plots()}>
                {(plot, index) => (
                  <Card class="border-2 border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm hover:shadow-md">
                    <CardContent class="p-5 space-y-4">
                      <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center gap-3">
                          <div class="bg-gradient-to-br from-blue-500 to-cyan-500 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
                            {index() + 1}
                          </div>
                          <h3 class="font-semibold text-lg">
                            {plot.plot_name || `Участок ${index() + 1}`}
                          </h3>
                        </div>
                        <Show when={plots().length > 1}>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removePlot(index())}
                          >
                            <Trash2 size={16} class="mr-1" />
                            Удалить
                          </Button>
                        </Show>
                      </div>

                      <div class="space-y-3">
                        <div>
                          <Label class="flex items-center gap-2 mb-2">
                            <MapPin size={16} />
                            Название участка
                          </Label>
                          <Input
                            type="text"
                            placeholder="Например: Поле 1"
                            value={plot.plot_name}
                            onInput={(e) => updatePlot(index(), 'plot_name', e.target.value)}
                            class="h-11"
                          />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label class="flex items-center gap-2 mb-2">
                              <TrendingUp size={16} />
                              Площадь (га)
                            </Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              required
                              placeholder="0.0"
                              value={plot.area}
                              onInput={(e) => updatePlot(index(), 'area', e.target.value)}
                              class="h-11"
                            />
                          </div>

                          <div>
                            <Label class="flex items-center gap-2 mb-2">
                              <Sprout size={16} />
                              Культура
                            </Label>
                            <select
                              required
                              class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              value={plot.crop}
                              onChange={(e) => updatePlot(index(), 'crop', e.target.value)}
                            >
                              <option value="">Выберите культуру</option>
                              <option value="cotton">Хлопок</option>
                              <option value="alfalfa">Люцерна</option>
                              <option value="grain">Зерновые</option>
                              <option value="orchard">Сады</option>
                            </select>
                          </div>

                          <div>
                            <Label class="flex items-center gap-2 mb-2">
                              <Droplet size={16} />
                              Фаза роста
                            </Label>
                            <select
                              required
                              class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              value={plot.growth_stage}
                              onChange={(e) => updatePlot(index(), 'growth_stage', e.target.value)}
                            >
                              <option value="">Выберите фазу</option>
                              <option value="early">Ранняя</option>
                              <option value="active">Активная</option>
                              <option value="late">Поздняя</option>
                            </select>
                          </div>

                          <div>
                            <Label class="flex items-center gap-2 mb-2">
                              <MapPin size={16} />
                              Регион
                            </Label>
                            <select
                              required
                              class="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              value={plot.region}
                              onChange={(e) => updatePlot(index(), 'region', e.target.value)}
                            >
                              <option value="">Выберите регион</option>
                              <option value="dushanbe">Душанбе</option>
                              <option value="sughd">Согд</option>
                              <option value="khatlon">Хатлон</option>
                              <option value="gbao">ГБАО</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </For>
            </div>

            {/* Add Plot Button */}
            <Button
              type="button"
              variant="outline"
              class="w-full border-2 border-dashed border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 h-14 text-base font-medium transition-all"
              onClick={addPlot}
            >
              <Plus size={20} class="mr-2" />
              Добавить участок
            </Button>

            {/* Submit Button */}
            <div class="pt-2">
              <Button
                type="submit"
                class="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
                disabled={loading()}
              >
                <Show when={!loading()} fallback={<span>Расчет...</span>}>
                  <Layers size={20} class="mr-2" />
                  Рассчитать все участки
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
        <div class="space-y-4 animate-fade-in">
          {/* Summary Card */}
          <Card class="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border-2 border-green-300 dark:border-green-700 shadow-lg">
            <CardHeader>
              <CardTitle class="text-green-800 dark:text-green-300 flex items-center gap-2">
                <Droplet size={24} />
                Итоговые результаты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white/60 dark:bg-slate-900/60 p-5 rounded-xl">
                  <div class="flex items-center gap-2 mb-2">
                    <Layers size={18} class="text-green-600 dark:text-green-400" />
                    <div class="text-sm text-green-600 dark:text-green-400 font-medium">Участков</div>
                  </div>
                  <div class="text-3xl font-bold text-green-800 dark:text-green-200">
                    {result().summary.total_plots}
                  </div>
                </div>

                <div class="bg-white/60 dark:bg-slate-900/60 p-5 rounded-xl">
                  <div class="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} class="text-green-600 dark:text-green-400" />
                    <div class="text-sm text-green-600 dark:text-green-400 font-medium">Площадь</div>
                  </div>
                  <div class="text-3xl font-bold text-green-800 dark:text-green-200">
                    {result().summary.total_area.toFixed(2)}
                    <span class="text-lg ml-1">га</span>
                  </div>
                </div>

                <div class="bg-white/60 dark:bg-slate-900/60 p-5 rounded-xl">
                  <div class="flex items-center gap-2 mb-2">
                    <Droplet size={18} class="text-green-600 dark:text-green-400" />
                    <div class="text-sm text-green-600 dark:text-green-400 font-medium">Объем воды</div>
                  </div>
                  <div class="text-3xl font-bold text-green-800 dark:text-green-200">
                    {result().summary.total_water.toFixed(0)}
                    <span class="text-lg ml-1">м³</span>
                  </div>
                </div>

                <div class="bg-white/60 dark:bg-slate-900/60 p-5 rounded-xl">
                  <div class="flex items-center gap-2 mb-2">
                    <Sprout size={18} class="text-green-600 dark:text-green-400" />
                    <div class="text-sm text-green-600 dark:text-green-400 font-medium">На 1 га</div>
                  </div>
                  <div class="text-3xl font-bold text-green-800 dark:text-green-200">
                    {result().summary.average_water_per_ha.toFixed(0)}
                    <span class="text-lg ml-1">м³/га</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Plot Results */}
          <Card>
            <CardHeader>
              <CardTitle>Детализация по участкам</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <For each={result().plots}>
                  {(plotResult, index) => (
                    <div class="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div class="flex items-center gap-3">
                        <div class="bg-blue-500 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                          {index() + 1}
                        </div>
                        <div>
                          <div class="font-semibold">{plotResult.plot_name}</div>
                          <div class="text-sm text-muted-foreground">
                            {plotResult.area} га • {plotResult.crop}
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="font-bold text-lg text-blue-600 dark:text-blue-400">
                          {plotResult.total_water.toFixed(0)} м³
                        </div>
                        <div class="text-sm text-muted-foreground">
                          {plotResult.water_per_ha.toFixed(0)} м³/га
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>
        </div>
      </Show>
    </div>
  );
}

export default MultiplePlots;

