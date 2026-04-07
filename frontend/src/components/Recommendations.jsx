import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import {
  Lightbulb,
  CloudRain,
  Thermometer,
  Wind,
  Sprout,
  Wheat,
  Leaf,
  Droplet,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Microscope
} from 'lucide-solid';
import { For } from 'solid-js';

const iconMap = {
  'lightbulb': Lightbulb,
  'cloud-rain': CloudRain,
  'thermometer': Thermometer,
  'wind': Wind,
  'sprout': Sprout,
  'wheat': Wheat,
  'leaf': Leaf,
  'droplet': Droplet,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  'bar-chart': BarChart3,
  'microscope': Microscope,
};

function parseRecommendation(text) {
  const match = text.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (match) {
    const iconName = match[1];
    const content = match[2];
    return { icon: iconMap[iconName] || Lightbulb, text: content };
  }
  return { icon: Lightbulb, text };
}

function Recommendations(props) {
  if (!props.recommendations || props.recommendations.length === 0) return null;

  return (
    <Card class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-l-4 border-green-500">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-green-800 dark:text-green-300">
          <Lightbulb size={24} class="text-green-600 dark:text-green-400" />
          Рекомендации
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul class="space-y-3">
          <For each={props.recommendations}>
            {(rec) => {
              const { icon: IconComponent, text } = parseRecommendation(rec);
              return (
                <li class="text-green-700 dark:text-green-300 text-sm leading-relaxed border-b border-green-200 dark:border-green-800 last:border-0 pb-3 last:pb-0 flex items-start gap-2">
                  <IconComponent size={16} class="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </li>
              );
            }}
          </For>
        </ul>
      </CardContent>
    </Card>
  );
}

export default Recommendations;

