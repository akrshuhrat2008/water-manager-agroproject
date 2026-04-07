import { For, Show } from 'solid-js';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { CheckCircle, AlertTriangle, XCircle, Info, Droplet, TrendingUp } from 'lucide-solid';

export default function Case1Results(props) {
  const result = () => props.result;

  // Статус валидации
  const getValidationIcon = (status) => {
    switch (status) {
      case 'OK':
        return <CheckCircle class="w-5 h-5 text-green-600" />;
      case 'WARNING':
        return <AlertTriangle class="w-5 h-5 text-yellow-600" />;
      case 'INVALID':
        return <XCircle class="w-5 h-5 text-red-600" />;
      default:
        return <Info class="w-5 h-5 text-gray-600" />;
    }
  };

  const getValidationColor = (status) => {
    switch (status) {
      case 'OK':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'INVALID':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  return (
    <div class="space-y-6">
      {/* Общая информация */}
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Droplet class="w-5 h-5 text-blue-600" />
            Общая информация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-sm text-gray-500 dark:text-gray-400">Площадь</p>
              <p class="text-lg font-semibold">{result().area} га</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-gray-500 dark:text-gray-400">Культура</p>
              <p class="text-lg font-semibold capitalize">{result().crop}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-gray-500 dark:text-gray-400">Зона гидромодуля</p>
              <p class="text-lg font-semibold">{result().hydromodule_zone}</p>
            </div>
            <div class="space-y-1">
              <p class="text-sm text-gray-500 dark:text-gray-400">Сезонная норма</p>
              <p class="text-lg font-semibold">{result().seasonal_norm_m3_ha} м³/га</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Итоговые объемы */}
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <TrendingUp class="w-5 h-5 text-green-600" />
            Расчетные объемы воды
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Рассчитанный объем</p>
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {result().calculated_total_volume_thousand_m3}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">тыс. м³</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Ожидаемый объем (сезонный)</p>
              <p class="text-3xl font-bold text-gray-700 dark:text-gray-300">
                {result().expected_seasonal_volume_thousand_m3}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">тыс. м³</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Валидация водного баланса */}
      <Card class={getValidationColor(result().validation.status)}>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            {getValidationIcon(result().validation.status)}
            Валидация водного баланса
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-medium">Статус:</span>
              <Badge variant={result().validation.status === 'OK' ? 'success' : result().validation.status === 'WARNING' ? 'warning' : 'error'}>
                {result().validation.status}
              </Badge>
            </div>
            <div class="flex items-center justify-between">
              <span class="font-medium">Отклонение:</span>
              <span class="font-semibold">{result().validation.deviation_percent}%</span>
            </div>
            <p class="text-sm italic">{result().validation.message}</p>
          </div>
        </CardContent>
      </Card>

      {/* План по декадам */}
      <Card>
        <CardHeader>
          <CardTitle>План водопользования по декадам</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left p-2">Декада</th>
                  <th class="text-left p-2">Фаза роста</th>
                  <th class="text-right p-2">Дни полива (t₀)</th>
                  <th class="text-right p-2">q₀ (л/с·га)</th>
                  <th class="text-right p-2">qd (л/с·га)</th>
                  <th class="text-right p-2">Q (л/с)</th>
                  <th class="text-right p-2">W (тыс. м³)</th>
                </tr>
              </thead>
              <tbody>
                <For each={result().decade_plan}>
                  {(decade, index) => (
                    <tr class="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td class="p-2 font-medium">{decade.decade_name}</td>
                      <td class="p-2">
                        <Badge variant="outline">{decade.growth_stage}</Badge>
                      </td>
                      <td class="text-right p-2">
                        {decade.irrigation_days} / {decade.total_days}
                      </td>
                      <td class="text-right p-2">{decade.q0}</td>
                      <td class="text-right p-2 font-semibold text-blue-600">{decade.qd}</td>
                      <td class="text-right p-2">{decade.discharge_l_s}</td>
                      <td class="text-right p-2 font-bold text-green-600">
                        {decade.water_volume_thousand_m3}
                      </td>
                    </tr>
                  )}
                </For>
                {/* Итоговая строка */}
                <tr class="bg-gray-100 dark:bg-gray-800 font-bold">
                  <td colspan="6" class="p-2 text-right">ИТОГО:</td>
                  <td class="text-right p-2 text-lg text-green-600">
                    {result().calculated_total_volume_thousand_m3}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Объяснения расчета */}
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Info class="w-5 h-5" />
            Объяснения расчета
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <For each={result().explanations}>
              {(explanation) => (
                <div class="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div class="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p class="text-sm">{explanation}</p>
                </div>
              )}
            </For>
          </div>
        </CardContent>
      </Card>

      {/* Формулы */}
      <Card>
        <CardHeader>
          <CardTitle>Использованные формулы</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <For each={result().formulas_used}>
              {(formula) => (
                <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded font-mono text-sm">
                  {formula}
                </div>
              )}
            </For>
          </div>
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <strong>Метод расчета:</strong> {result().calculation_method}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Пояснения по декадам */}
      <Card>
        <CardHeader>
          <CardTitle>Детальные пояснения по декадам</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <For each={result().decade_plan}>
              {(decade) => (
                <div class="border-l-4 border-blue-500 pl-3 py-2">
                  <p class="font-semibold text-sm mb-1">{decade.decade_name}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{decade.explanation}</p>
                </div>
              )}
            </For>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}