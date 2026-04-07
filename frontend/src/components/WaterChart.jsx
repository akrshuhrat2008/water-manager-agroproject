import { onMount, onCleanup, createEffect } from 'solid-js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

function WaterChart(props) {
  let chartInstance = null;
  let canvasRef;
  let containerRef;

  const createChart = () => {
    if (!canvasRef || !props.dailyPlan || props.dailyPlan.length === 0) {
      console.log('WaterChart: canvasRef or dailyPlan is missing', { canvasRef, dailyPlan: props.dailyPlan });
      return;
    }

    // Проверяем, виден ли canvas
    if (!canvasRef.offsetParent) {
      console.log('WaterChart: canvas is not visible, skipping chart creation');
      return;
    }

    // Уничтожаем предыдущий график, если он существует
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    const ctx = canvasRef.getContext('2d');

    // Форматирование дат
    const formatChartDate = (dayNumber) => {
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayNumber - 1);

      const day = targetDate.getDate();
      const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
      const month = months[targetDate.getMonth()];

      return `${day} ${month}`;
    };

    const days = props.dailyPlan.map((item) => formatChartDate(item.day));
    const water = props.dailyPlan.map((item) => item.water);
    const colors = props.dailyPlan.map((item) => {
      if (item.note === 'rain_expected') return '#2196F3';
      if (item.note === 'high_temperature') return '#FF9800';
      return '#4CAF50';
    });

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Объем воды (м³)',
            data: water,
            backgroundColor: colors,
            borderColor: colors.map((c) => c + 'DD'),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Объем: ${context.parsed.y.toFixed(2)} м³`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Объем воды (м³)',
            },
            grid: {
              color: 'rgba(0,0,0,0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  };

  onMount(() => {
    // Задержка для корректной инициализации canvas
    setTimeout(() => {
      createChart();
    }, 100);

    // Наблюдаем за изменением размера контейнера (при переключении вкладок)
    const resizeObserver = new ResizeObserver(() => {
      if (canvasRef && canvasRef.offsetParent && props.dailyPlan && props.dailyPlan.length > 0) {
        setTimeout(() => {
          createChart();
        }, 50);
      }
    });

    if (containerRef) {
      resizeObserver.observe(containerRef);
    }

    onCleanup(() => {
      resizeObserver.disconnect();
    });
  });

  // Обновляем график при изменении данных
  createEffect(() => {
    if (props.dailyPlan && props.dailyPlan.length > 0 && canvasRef && canvasRef.offsetParent) {
      setTimeout(() => {
        createChart();
      }, 50);
    }
  });

  onCleanup(() => {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  });

  return (
    <div ref={(el) => { containerRef = el; }} class="h-64 w-full">
      <canvas ref={(el) => { canvasRef = el; }}></canvas>
    </div>
  );
}

export default WaterChart;

