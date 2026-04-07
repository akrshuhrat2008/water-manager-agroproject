import {
  Droplet,
  Sprout,
  Wheat,
  Apple,
  Leaf,
  Sun,
  CloudRain,
  TrendingUp,
  Calendar,
  Lightbulb,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Info,
} from "lucide-solid";

// Mapping from emoji/icon names to lucide components
const iconMap = {
  // Water and irrigation
  droplet: Droplet,
  water: Droplet,

  // Crops
  sprout: Sprout,
  seedling: Sprout,
  wheat: Wheat,
  grain: Wheat,
  apple: Apple,
  orchard: Apple,
  leaf: Leaf,
  alfalfa: Leaf,

  // Growth stages
  sun: Sun,
  early: Sprout,
  active: Wheat,
  late: Leaf,

  // Weather
  rain: CloudRain,
  cloud: CloudRain,

  // Charts and data
  chart: TrendingUp,
  trending: TrendingUp,
  bar_chart: BarChart3,

  // Planning
  calendar: Calendar,

  // Recommendations
  lightbulb: Lightbulb,
  recommendation: Lightbulb,

  // Export
  excel: FileSpreadsheet,
  spreadsheet: FileSpreadsheet,
  pdf: FileText,
  document: FileText,

  // Info
  info: Info,
};

export function Icon(props) {
  const IconComponent = iconMap[props.name] || Info;

  return (
    <IconComponent
      size={props.size || 20}
      class={props.class}
      stroke-width={props.strokeWidth || 2}
    />
  );
}

// Export individual icons for direct use
export {
  Droplet,
  Sprout,
  Wheat,
  Apple,
  Leaf,
  Sun,
  CloudRain,
  TrendingUp,
  Calendar,
  Lightbulb,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Info,
};
