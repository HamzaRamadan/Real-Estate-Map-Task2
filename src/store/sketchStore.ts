import {create} from "zustand";
import Graphic from "@arcgis/core/Graphic";

interface SketchState {
  graphics: Graphic[];
  selectedGraphicIds: string[];
  addGraphic: (graphic: Graphic) => void;
  removeGraphic: (uid: string) => void;
  toggleSelect: (uid: string) => void;
  clearSelection: () => void;
  updateAttributes: (uid: string, newAttrs: { [key: string]: any }) => void;
}

export const useSketchStore = create<SketchState>((set, get) => ({
  graphics: [],
  selectedGraphicIds: [],

  addGraphic: (graphic) =>
    set((state) => ({
      graphics: [...state.graphics, graphic],
    })),

  removeGraphic: (uid) =>
    set((state) => ({
graphics: state.graphics.filter((g) => g.attributes?.uid !== uid),
      selectedGraphicIds: state.selectedGraphicIds.filter((id) => id !== uid),
    })),

  toggleSelect: (uid) => {
    const { selectedGraphicIds } = get();
    const isSelected = selectedGraphicIds.includes(uid);
    set({
      selectedGraphicIds: isSelected
        ? selectedGraphicIds.filter((id) => id !== uid)
        : [...selectedGraphicIds, uid],
    });
  },

  clearSelection: () => set({ selectedGraphicIds: [] }),

  updateAttributes: (uid, newAttrs) =>
    set((state) => ({
      graphics: state.graphics.map((g) => {
        if (g.attributes?.uid === uid) {
          // نحدث attributes فقط، نحتفظ بنفس geometry و symbol
          const updatedAttributes = {
            ...g.attributes,
            ...newAttrs,
          };
          return new Graphic({
            geometry: g.geometry,
            symbol: g.symbol,
            attributes: updatedAttributes,
            uid: g.attributes?.uid, // مهم نحافظ على نفس uid
          });
        }
        return g;
      }),
    })),
}));
