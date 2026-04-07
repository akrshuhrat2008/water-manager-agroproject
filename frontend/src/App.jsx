import { createSignal, Show, createEffect } from 'solid-js';
import Header from './components/Header';
import CalculationForm from './components/CalculationForm';
import Results from './components/Results';
import Loading from './components/Loading';
import ErrorMessage from './components/ErrorMessage';
import MultiplePlots from './components/MultiplePlots';
import Scenarios from './components/Scenarios';
import MonthlyPlan from './components/MonthlyPlan';
import PlotMap from './components/PlotMap';
import Case1Planning from './components/Case1Planning';
import { calculateWater } from './api/waterApi';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/Tabs';
import { Toaster, showToast } from './components/ui/Toast';
import { LayoutGrid, Layers, GitCompare, Calendar as CalendarIcon, MapPin, FileText } from 'lucide-solid';

function App() {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal(null);
  const [result, setResult] = createSignal(null);
  const [formData, setFormData] = createSignal(null);
  const [activeTab, setActiveTab] = createSignal('single'); // 'single', 'multiple', 'scenarios', 'monthly', 'map', 'case1'

  // Очищаем результаты при переключении вкладок
  createEffect(() => {
    const tab = activeTab();
    console.log('Tab changed to:', tab);
    // Очищаем результаты, ошибки и состояние загрузки
    setResult(null);
    setError(null);
    setLoading(false);
    setFormData(null);
  });

  const handleCalculate = async (data) => {
    console.log('handleCalculate called with:', data);
    setLoading(true);
    setError(null);
    setResult(null);
    setFormData(data);

    try {
      console.log('Calling calculateWater API...');
      const response = await calculateWater(data);
      console.log('API response:', response);
      setResult(response);
      showToast({
        title: 'Расчет выполнен',
        description: 'План водопользования успешно рассчитан',
        variant: 'success',
      });
    } catch (err) {
      console.error('Error in handleCalculate:', err);
      const errorMessage = err.message || 'Произошла ошибка при расчете';
      setError(errorMessage);
      showToast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-background">
      <Header />
      <Toaster />

      <main class="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab()} onChange={setActiveTab}>
          <TabsList class="mb-6 w-full justify-start">
            <TabsTrigger value="case1">
              <FileText size={18} />
              Официальная методика
            </TabsTrigger>
            <TabsTrigger value="single">
              <LayoutGrid size={18} />
              Один участок
            </TabsTrigger>
            <TabsTrigger value="multiple">
              <Layers size={18} />
              Множественные участки
            </TabsTrigger>
            <TabsTrigger value="scenarios">
              <GitCompare size={18} />
              Сравнение сценариев
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <CalendarIcon size={18} />
              План на месяц
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapPin size={18} />
              Карта участков
            </TabsTrigger>
          </TabsList>

          <TabsContent value="case1">
            <Case1Planning />
          </TabsContent>

          <TabsContent value="single">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-1">
                <CalculationForm onSubmit={handleCalculate} />
              </div>

              <div class="lg:col-span-2">
                <Loading show={loading()} />
                <ErrorMessage error={error()} />
                <Show when={result()}>
                  <Results result={result()} formData={formData()} />
                </Show>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="multiple">
            <MultiplePlots />
          </TabsContent>

          <TabsContent value="scenarios">
            <Scenarios />
          </TabsContent>

          <TabsContent value="monthly">
            <MonthlyPlan />
          </TabsContent>

          <TabsContent value="map">
            <PlotMap />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
