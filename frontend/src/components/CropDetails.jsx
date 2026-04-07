import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Wheat } from 'lucide-solid';

function CropDetails(props) {
  if (!props.cropInfo) return null;

  return (
    <Card class="bg-orange-50 dark:bg-orange-950 border-l-4 border-orange-500">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-orange-800 dark:text-orange-300">
          <Wheat size={24} class="text-orange-600 dark:text-orange-400" />
          {props.cropInfo.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-orange-700 dark:text-orange-300 text-sm leading-relaxed">
          {props.cropInfo.description}
        </p>
      </CardContent>
    </Card>
  );
}

export default CropDetails;

