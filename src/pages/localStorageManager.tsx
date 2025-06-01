import Graphic from "@arcgis/core/Graphic";
import { fromJSON } from "@arcgis/core/geometry/support/jsonUtils";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol";

const LOCAL_STORAGE_KEY = "user_drawings";

export function saveGraphicsToLocalStorage(graphicsToSave: Graphic[]) {
  const dataToSave = graphicsToSave.map((g) => ({
    geometry: g.geometry.toJSON(),
    attributes: g.attributes || {},
  }));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
}

export function loadGraphicsFromLocalStorage(): Graphic[] {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) return [];

  try {
    const graphicsData = JSON.parse(stored);
    return graphicsData.map((data: any) => {
      return new Graphic({
        geometry: fromJSON(data.geometry),
        attributes: data.attributes,
        symbol: new SimpleFillSymbol({
          color: [227, 139, 79, 0.8],
          outline: { color: [255, 255, 255], width: 1 },
        }),
      });
    });
  } catch (e) {
    console.error("Error loading graphics from localStorage:", e);
    return [];
  }
}
