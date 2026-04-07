import { createSignal, Show } from 'solid-js';
import Case1Form from './Case1Form';
import Case1Results from './Case1Results';
import Loading from './Loading';
import ErrorMessage from './ErrorMessage';
import { calculateCase1 } from '../api/waterApi';
import { showToast } from './ui/Toast';

export default function Case1Planning() {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal(null);
  const [result, setResult] = createSignal(null);

  const handleCalculate = async (formData) => {
    console.log('Case1Planning: handleCalculate called with:', formData);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Calling calculateCase1 API...');
      const response = await calculateCase1(formData);
      console.log('API response:', response);
      setResult(response);
      showToast({
        title: 'Расчет выполнен',
        description: 'План водопользования успешно рассчитан по официальной методике',
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
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1">
        <Case1Form onSubmit={handleCalculate} />
      </div>

      <div class="lg:col-span-2">
        <Loading show={loading()} />
        <ErrorMessage error={error()} />
        <Show when={result()}>
          <Case1Results result={result()} />
        </Show>
      </div>
    </div>
  );
}