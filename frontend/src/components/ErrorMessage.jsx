import { Card, CardContent } from './ui/Card';
import { AlertCircle } from 'lucide-solid';

function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <Card class="bg-red-50 dark:bg-red-950 border-l-4 border-red-500">
      <CardContent class="p-4">
        <div class="flex items-center gap-3">
          <AlertCircle size={24} class="text-red-500 flex-shrink-0" />
          <p class="text-red-700 dark:text-red-300 font-medium">Ошибка: {error}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ErrorMessage;

