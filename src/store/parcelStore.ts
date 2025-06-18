import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Parcel {
  id: number;
  geometry: any;
  attributes: any;
}

interface ParcelStore {
  parcels: Parcel[];
  addParcel: (parcel: Parcel) => void;
  removeParcel: (id: number) => void;
  clearParcels: () => void;
}

export const useParcelStore = create<ParcelStore>()(
  persist(
    (set) => ({
      parcels: [],
      addParcel: (parcel) =>
        set((state) => ({
          parcels: [...state.parcels, parcel],
        })),
      removeParcel: (id) =>
        set((state) => ({
          parcels: state.parcels.filter((parcel) => parcel.id !== id),
        })),
      clearParcels: () =>
        set({ parcels: [] }),
    }),
    {
      name: "parcel-storage", 
    }
  )
);


