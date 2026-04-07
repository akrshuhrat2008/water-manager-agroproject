import { Droplet, TrendingUp, Zap, CloudRain } from 'lucide-solid';

function StatsCards(props) {
  const stats = [
    {
      label: 'Общий объем',
      value: props.totalWater.toFixed(0),
      unit: 'м³',
      color: 'bg-gradient-to-br from-primary to-purple-600',
      icon: Droplet,
    },
    {
      label: 'Средний в день',
      value: props.statistics?.average_daily?.toFixed(0) || '0',
      unit: 'м³/день',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      icon: TrendingUp,
    },
    {
      label: 'Максимум',
      value: props.statistics?.max_daily?.toFixed(0) || '0',
      unit: 'м³',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      icon: Zap,
    },
    {
      label: 'Дней с дождем',
      value: props.statistics?.rain_days || 0,
      unit: 'дней',
      color: 'bg-gradient-to-br from-cyan-500 to-cyan-600',
      icon: CloudRain,
    },
  ];

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            class={`${stat.color} text-white rounded-xl p-6 shadow-lg transform transition-transform hover:scale-105`}
          >
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm opacity-90">{stat.label}</h4>
              <IconComponent size={24} class="opacity-80" />
            </div>
            <div class="text-3xl font-bold mb-1">{stat.value}</div>
            <div class="text-sm opacity-80">{stat.unit}</div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsCards;

