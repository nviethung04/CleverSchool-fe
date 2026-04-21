// Define fixed colors for items
const COLORS = [
  "bg-blue-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-pink-500",
  "bg-purple-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
]

const DARK_COLORS = [
  "bg-blue-700",
  "bg-yellow-700",
  "bg-green-700",
  "bg-pink-700",
  "bg-purple-700",
  "bg-indigo-700",
  "bg-teal-700",
  "bg-orange-700",
]

export function getColorByIndex(index: number, dark = false): string {
  const colorArray = dark ? DARK_COLORS : COLORS
  return colorArray[index % colorArray.length]
}

export function getDarkColorByIndex(index: number): string {
  return DARK_COLORS[index % DARK_COLORS.length]
}
