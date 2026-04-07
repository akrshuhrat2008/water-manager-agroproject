import { createSignal, createEffect, onMount } from 'solid-js';
import { CROP_INFO } from '../constants/crops';
import { getRegions } from '../api/dataApi';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Wheat, Leaf, Apple, Sprout, Info, Calculator } from 'lucide-solid';

function CalculationForm({ onSubmit }) {
  const [formData, setFormData] = createSignal({
    area: '',
    crop: '',
    growth_stage: '',
    days: '7',
    region: '',
  });

  const [selectedCropInfo, setSelectedCropInfo] = createSignal(null);
  const [regions, setRegions] = createSignal([]);
  const [loadingRegions, setLoadingRegions] = createSignal(false);

  onMount(async () => {
    try {
      setLoadingRegions(true);
      const data = await getRegions();
      setRegions(data.regions || []);
    } catch (error) {
      console.error('Ошибка загрузки регионов:', error);
    } finally {
      setLoadingRegions(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = formData();
    console.log('Form submitted with data:', data);
    
    // Валидация
    if (!data.area || !data.crop || !data.growth_stage || !data.region) {
      console.error('Validation failed:', { area: data.area, crop: data.crop, growth_stage: data.growth_stage, region: data.region });
      alert('Пожалуйста, заполните все поля');
      return;
    }

    const submitData = {
      area: parseFloat(data.area),
      crop: data.crop,
      growth_stage: data.growth_stage,
      days: parseInt(data.days),
      region: data.region,
    };

    console.log('Submitting:', submitData);
    onSubmit(submitData);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData(), [field]: value });
  };

  createEffect(() => {
    const crop = formData().crop;
    if (crop && CROP_INFO[crop]) {
      setSelectedCropInfo(CROP_INFO[crop]);
    } else {
      setSelectedCropInfo(null);
    }
  });

  const cropOptions = [
    { value: 'cotton', label: 'Хлопок', icon: Wheat },
    { value: 'alfalfa', label: 'Люцерна', icon: Leaf },
    { value: 'grain', label: 'Зерновые', icon: Wheat },
    { value: 'orchard', label: 'Садовые культуры', icon: Apple },
  ];

  const growthStageOptions = [
    { value: 'early', label: 'Ранняя', icon: Sprout },
    { value: 'active', label: 'Активная', icon: Wheat },
    { value: 'late', label: 'Поздняя', icon: Leaf },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Параметры расчета</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} class="space-y-6">
          <div class="space-y-2">
            <Label for="area">Площадь участка (га)</Label>
            <Input
              id="area"
              type="number"
              step="0.1"
              min="0.1"
              required
              placeholder="Например: 5"
              value={formData().area}
              onInput={(e) => updateField('area', e.target.value)}
            />
          </div>

          <div class="space-y-2">
            <Label for="crop">Культура</Label>
            <div class="relative">
              <select
                id="crop"
                value={formData().crop}
                onChange={(e) => updateField('crop', e.target.value)}
                required
                class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Выберите культуру</option>
                {cropOptions.map((opt) => (
                  <option value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {selectedCropInfo() && (
              <div class="mt-2 p-3 bg-blue-50 dark:bg-blue-950 border-l-4 border-primary rounded-lg flex gap-2">
                <Info size={16} class="text-primary flex-shrink-0 mt-0.5" />
                <div class="text-sm text-blue-700 dark:text-blue-300">
                  <strong>{selectedCropInfo().name}:</strong> {selectedCropInfo().description}
                </div>
              </div>
            )}
          </div>

          <div class="space-y-2">
            <Label for="growth_stage">Фаза роста</Label>
            <select
              id="growth_stage"
              value={formData().growth_stage}
              onChange={(e) => updateField('growth_stage', e.target.value)}
              required
              class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Выберите фазу</option>
              {growthStageOptions.map((opt) => (
                <option value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div class="space-y-2">
            <Label for="days">Период планирования (дней)</Label>
            <select
              id="days"
              value={formData().days}
              onChange={(e) => updateField('days', e.target.value)}
              required
              class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="7">7 дней</option>
              <option value="10">10 дней</option>
            </select>
          </div>

          <div class="space-y-2">
            <Label for="region">Регион</Label>
            {loadingRegions() ? (
              <div class="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                Загрузка регионов...
              </div>
            ) : regions().length > 0 ? (
              <select
                id="region"
                value={formData().region}
                onChange={(e) => updateField('region', e.target.value)}
                required
                class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Выберите регион</option>
                {regions().map((region) => (
                  <option value={region.name}>{region.name_ru}</option>
                ))}
              </select>
            ) : (
              <Input
                id="region"
                type="text"
                required
                placeholder="Например: sughd"
                value={formData().region}
                onInput={(e) => updateField('region', e.target.value)}
              />
            )}
          </div>

          <Button
            type="submit"
            class="w-full"
            size="lg"
          >
            <Calculator size={20} class="mr-2" />
            Рассчитать план водопользования
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default CalculationForm;

