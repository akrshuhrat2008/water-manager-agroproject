import { Show, createMemo } from 'solid-js';
import StatsCards from './StatsCards';
import WaterChart from './WaterChart';
import DailyPlanTable from './DailyPlanTable';
import Recommendations from './Recommendations';
import ExportButtons from './ExportButtons';
import CropDetails from './CropDetails';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { TrendingUp, Calendar } from 'lucide-solid';

function Results(props) {
  // Use createMemo to ensure reactivity
  const hasResult = createMemo(() => {
    console.log('Results hasResult check:', !!props.result);
    return !!props.result;
  });

  return (
    <Show when={hasResult()}>
      <div class="space-y-6">
        <Show when={props.result?.crop_info}>
          <CropDetails cropInfo={props.result.crop_info} />
        </Show>

        <StatsCards
          totalWater={props.result.total_water}
          statistics={props.result.statistics}
        />

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <TrendingUp size={24} class="text-primary" />
              График поливов по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WaterChart dailyPlan={props.result.daily_plan} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Calendar size={24} class="text-primary" />
              План по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DailyPlanTable dailyPlan={props.result.daily_plan} />
          </CardContent>
        </Card>

        <Recommendations recommendations={props.result.recommendations} />

        <ExportButtons formData={props.formData} />
      </div>
    </Show>
  );
}

export default Results;

