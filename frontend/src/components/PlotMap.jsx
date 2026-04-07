import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { MapPin, Plus, Trash2, Edit3, Save, X } from 'lucide-solid';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { showToast } from './ui/Toast';
import 'leaflet/dist/leaflet.css';

// Координаты регионов Таджикистана
const REGIONS = {
  dushanbe: { name: 'Душанбе', coords: [38.5598, 68.7738], zoom: 12 },
  sughd: { name: 'Согдийская область', coords: [40.2833, 68.7667], zoom: 10 },
  khatlon: { name: 'Хатлонская область', coords: [37.8333, 69.0167], zoom: 10 },
  gbao: { name: 'ГБАО', coords: [38.4167, 72.8167], zoom: 9 }
};

function PlotMap() {
  let mapContainer;
  let map;
  let L;

  const [plots, setPlots] = createSignal([]);
  const [selectedRegion, setSelectedRegion] = createSignal('dushanbe');
  const [isAddingPlot, setIsAddingPlot] = createSignal(false);
  const [editingPlot, setEditingPlot] = createSignal(null);
  const [newPlot, setNewPlot] = createSignal({
    name: '',
    area: '',
    crop: '',
    coordinates: null
  });

  onMount(async () => {
    // Динамический импорт Leaflet
    L = (await import('leaflet')).default;

    // Исправление иконок Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    initMap();
  });

  onCleanup(() => {
    if (map) {
      map.remove();
    }
  });

  const initMap = () => {
    const region = REGIONS[selectedRegion()];

    map = L.map(mapContainer).setView(region.coords, region.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Добавляем обработчик клика для добавления участка
    map.on('click', (e) => {
      if (isAddingPlot()) {
        setNewPlot({ ...newPlot(), coordinates: [e.latlng.lat, e.latlng.lng] });
        addTemporaryMarker(e.latlng);
      }
    });

    // Отображаем существующие участки
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!map || !L) return;

    // Очищаем существующие маркеры
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Добавляем маркеры для каждого участка
    plots().forEach((plot, index) => {
      if (plot.coordinates) {
        const marker = L.marker(plot.coordinates).addTo(map);

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${plot.name}</h3>
            <p style="margin: 4px 0;"><strong>Площадь:</strong> ${plot.area} га</p>
            <p style="margin: 4px 0;"><strong>Культура:</strong> ${plot.crop}</p>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">
              ${plot.coordinates[0].toFixed(4)}, ${plot.coordinates[1].toFixed(4)}
            </p>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Добавляем кастомную иконку с цветом
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background-color: #10b981;
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="
                transform: rotate(45deg);
                color: white;
                font-weight: bold;
                font-size: 14px;
              ">${index + 1}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        marker.setIcon(customIcon);
      }
    });
  };

  let temporaryMarker = null;

  const addTemporaryMarker = (latlng) => {
    if (!L) return;

    // Удаляем предыдущий временный маркер
    if (temporaryMarker) {
      map.removeLayer(temporaryMarker);
    }

    // Создаем новый временный маркер
    const tempIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: #3b82f6;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 1.5s infinite;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">?</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    temporaryMarker = L.marker(latlng, { icon: tempIcon }).addTo(map);
  };

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    if (map) {
      const regionData = REGIONS[region];
      map.setView(regionData.coords, regionData.zoom);
    }
  };

  const handleAddPlot = () => {
    setIsAddingPlot(true);
    setNewPlot({ name: '', area: '', crop: '', coordinates: null });
    showToast({
      title: 'Добавление участка',
      description: 'Кликните на карту, чтобы выбрать местоположение участка',
      variant: 'default'
    });
  };

  const handleSavePlot = () => {
    const plot = newPlot();

    if (!plot.name || !plot.area || !plot.crop) {
      showToast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'error'
      });
      return;
    }

    if (!plot.coordinates) {
      showToast({
        title: 'Ошибка',
        description: 'Выберите местоположение на карте',
        variant: 'error'
      });
      return;
    }

    setPlots([...plots(), plot]);
    setIsAddingPlot(false);
    setNewPlot({ name: '', area: '', crop: '', coordinates: null });

    if (temporaryMarker) {
      map.removeLayer(temporaryMarker);
      temporaryMarker = null;
    }

    updateMarkers();

    showToast({
      title: 'Успех',
      description: 'Участок успешно добавлен',
      variant: 'success'
    });
  };

  const handleCancelAdd = () => {
    setIsAddingPlot(false);
    setNewPlot({ name: '', area: '', crop: '', coordinates: null });

    if (temporaryMarker) {
      map.removeLayer(temporaryMarker);
      temporaryMarker = null;
    }
  };

  const handleDeletePlot = (index) => {
    const updatedPlots = plots().filter((_, i) => i !== index);
    setPlots(updatedPlots);
    updateMarkers();

    showToast({
      title: 'Участок удален',
      description: 'Участок успешно удален с карты',
      variant: 'default'
    });
  };

  return (
    <div class="space-y-6">
      {/* Заголовок */}
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <MapPin class="text-green-600" />
            Карта участков
          </CardTitle>
          <CardDescription>
            Визуализация и управление сельскохозяйственными участками на карте
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Выбор региона */}
      <Card>
        <CardContent class="pt-6">
          <div class="space-y-4">
            <label class="block text-sm font-medium">Регион</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <For each={Object.entries(REGIONS)}>
                {([key, region]) => (
                  <button
                    onClick={() => handleRegionChange(key)}
                    class={`px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedRegion() === key
                        ? 'border-green-600 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-semibold'
                        : 'border-border hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    {region.name}
                  </button>
                )}
              </For>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Карта */}
        <div class="lg:col-span-2">
          <Card>
            <CardContent class="p-0">
              <div
                ref={mapContainer}
                style="height: 600px; width: 100%; border-radius: 8px;"
              />
            </CardContent>
          </Card>
        </div>

        {/* Список участков */}
        <div class="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Участки</CardTitle>
              <Button
                onClick={handleAddPlot}
                disabled={isAddingPlot()}
                class="w-full mt-2"
              >
                <Plus size={16} />
                Добавить участок
              </Button>
            </CardHeader>
            <CardContent class="space-y-4">
              {/* Форма добавления */}
              <Show when={isAddingPlot()}>
                <div class="p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-950 space-y-3">
                  <h4 class="font-semibold text-sm text-blue-700 dark:text-blue-300">
                    Новый участок
                  </h4>

                  <div>
                    <label class="block text-xs font-medium mb-1">Название</label>
                    <input
                      type="text"
                      value={newPlot().name}
                      onInput={(e) => setNewPlot({ ...newPlot(), name: e.target.value })}
                      placeholder="Например: Участок №1"
                      class="w-full px-3 py-2 border border-input rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium mb-1">Площадь (га)</label>
                    <input
                      type="number"
                      value={newPlot().area}
                      onInput={(e) => setNewPlot({ ...newPlot(), area: e.target.value })}
                      placeholder="10"
                      min="0"
                      step="0.1"
                      class="w-full px-3 py-2 border border-input rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium mb-1">Культура</label>
                    <select
                      value={newPlot().crop}
                      onChange={(e) => setNewPlot({ ...newPlot(), crop: e.target.value })}
                      class="w-full px-3 py-2 border border-input rounded-md text-sm"
                    >
                      <option value="">Выберите культуру</option>
                      <option value="cotton">Хлопок</option>
                      <option value="wheat">Пшеница</option>
                      <option value="vegetables">Овощи</option>
                      <option value="fruits">Фрукты</option>
                      <option value="rice">Рис</option>
                    </select>
                  </div>

                  <div class="text-xs text-muted-foreground">
                    {newPlot().coordinates ? (
                      <div class="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <MapPin size={12} />
                        Координаты выбраны
                      </div>
                    ) : (
                      <div class="text-orange-600 dark:text-orange-400">
                        Кликните на карту
                      </div>
                    )}
                  </div>

                  <div class="flex gap-2">
                    <Button onClick={handleSavePlot} class="flex-1" size="sm">
                      <Save size={14} />
                      Сохранить
                    </Button>
                    <Button onClick={handleCancelAdd} variant="outline" size="sm">
                      <X size={14} />
                      Отмена
                    </Button>
                  </div>
                </div>
              </Show>

              {/* Список участков */}
              <div class="space-y-2">
                <Show when={plots().length === 0 && !isAddingPlot()}>
                  <div class="text-center py-8 text-muted-foreground text-sm">
                    <MapPin size={32} class="mx-auto mb-2 opacity-30" />
                    Участки не добавлены
                  </div>
                </Show>

                <For each={plots()}>
                  {(plot, index) => (
                    <div class="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <div class="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                              {index() + 1}
                            </div>
                            <h4 class="font-semibold text-sm">{plot.name}</h4>
                          </div>
                          <div class="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div>Площадь: {plot.area} га</div>
                            <div>Культура: {plot.crop}</div>
                            <div class="flex items-center gap-1">
                              <MapPin size={10} />
                              {plot.coordinates[0].toFixed(4)}, {plot.coordinates[1].toFixed(4)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePlot(index())}
                          class="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Статистика */}
      <Show when={plots().length > 0}>
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {plots().length}
                </div>
                <div class="text-sm text-muted-foreground">Всего участков</div>
              </div>

              <div class="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {plots().reduce((sum, plot) => sum + parseFloat(plot.area || 0), 0).toFixed(1)}
                </div>
                <div class="text-sm text-muted-foreground">Общая площадь (га)</div>
              </div>

              <div class="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {plots().length > 0
                    ? (plots().reduce((sum, plot) => sum + parseFloat(plot.area || 0), 0) / plots().length).toFixed(1)
                    : '0.0'
                  }
                </div>
                <div class="text-sm text-muted-foreground">Средняя площадь (га)</div>
              </div>

              <div class="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {REGIONS[selectedRegion()].name}
                </div>
                <div class="text-sm text-muted-foreground">Текущий регион</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Show>
    </div>
  );
}

export default PlotMap;
