import { divIcon } from "leaflet"

export function getColor(index: number) {

  if (index > 10)
    return "bg-red-950"

  switch (index)
  {
    case 1:
      return "bg-cyan-500"
    case 2:
      return "bg-sky-600"
    case 3:
      return "bg-blue-600"
    case 4:
      return "bg-yellow-400"
    case 5:
      return "bg-amber-400" 
    case 6:
      return "bg-amber-600" 
    case 7:
      return "bg-red-400" 
    case 8:
      return "bg-red-600"
    case 9:
      return "bg-red-800"
    case 10:
      return "bg-red-900"
    default:
      return "bg-gray-500"
  }

}

export function getColorRGB(index: number) {
  if (index > 10)
      return "#7f1d1d"; 

  switch (index) {
      case 1:
          return "#36c6f4"; 
      case 2:
          return "#1a99ce"; 
      case 3:
          return "#13689b"; 
      case 4:
          return "#f3ec1a";
      case 5:
          return "#fecd08"; 
      case 6:
          return "#f89939"; 
      case 7:
          return "#f16768"; 
      case 8:
          return "#ed2024"; 
      case 9:
          return "#cd2027"; 
      case 10:
          return "#991b1e"; 
      default:
          return "#6b7280"; 
  }
}

export function createPurpleAirSensorIcon(index: number) {
  // circle icon
  const sensorIcon = divIcon({
    className: `rounded-full flex items-center justify-center font-bold text-white border-2 border-black ${getColor(index)}`,
    html: `<h1 data-testid="purpleair-marker">${index}</h1>`,
    iconSize: [30, 30]
  });

  return sensorIcon;
}

export function createPurpleAirHighlightedSensorIcon(index: number) {
  // circle icon
  const sensorIcon = divIcon({
    className: `rounded-full flex items-center justify-center font-bold text-white text-xl border-8 border-black ${getColor(index)}`,
    html: `<h1 class="">${index}</h1>`,
    iconSize: [50, 50]
  });

  return sensorIcon;
}

export function createStationSensorIcon(index: number) {
  // square icon
  const sensorIcon = divIcon({
    className: `w-30 h-30 aspect-w-1 aspect-h-1 border-2 border-black flex items-center justify-center text-white ${getColor(index)}`,
    html: `<h1 data-testid="station-marker">${index}</h1>`,
    iconSize: [30, 30]
  });

  return sensorIcon;
}