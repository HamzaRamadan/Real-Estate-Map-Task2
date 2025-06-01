// src/store/mapStore.ts
import { create } from "zustand";
import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import type MapView from "@arcgis/core/views/MapView";

interface MapState {
  view: MapView | null;
  sketchGraphicsLayer: GraphicsLayer | null;
  setView: (view: MapView) => void;
  setSketchGraphicsLayer: (layer: GraphicsLayer) => void;
}

export const useMapStore = create<MapState>((set) => ({
  view: null,
  sketchGraphicsLayer: null,
  setView: (view) => set({ view }),
  setSketchGraphicsLayer: (layer) => set({ sketchGraphicsLayer: layer }),
}));
