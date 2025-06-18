import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import MapView from "@arcgis/core/views/MapView";
import {
  saveGraphicsToLocalStorage,
  loadGraphicsFromLocalStorage,
} from "../pages/localStorageManager";

type SetupSketchOptions = {
  view: MapView;
  sketchLayer: GraphicsLayer;
  t: (key: string) => string;
  setGraphics: React.Dispatch<React.SetStateAction<Graphic[]>>;
  setSelectedGraphics: React.Dispatch<React.SetStateAction<Graphic[]>>;
  onCreateGraphic: (graphic: __esri.Graphic) => void; 
};

export function initializeSketchVM({
  view,
  sketchLayer,
  setGraphics,
  setSelectedGraphics,
  onCreateGraphic,
}: SetupSketchOptions): SketchViewModel {
  const sketchVM = new SketchViewModel({
    view,
    layer: sketchLayer,
  });

  // تحميل الرسومات من localStorage
  const savedGraphics = loadGraphicsFromLocalStorage();
  sketchLayer.addMany(savedGraphics);
  setGraphics(savedGraphics);

  sketchVM.on("create", (event) => {
    if (event.state === "complete") {
      onCreateGraphic(event.graphic); 
    }
  });

  sketchVM.on("delete", (event) => {
    const deletedUIDs = event.graphics.map((g) => g.attributes?.uid);
    setGraphics((prevGraphics) => {
      const updatedGraphics = prevGraphics.filter(
        (g) => !deletedUIDs.includes(g.attributes?.uid)
      );
      saveGraphicsToLocalStorage(updatedGraphics);
      return updatedGraphics;
    });
    setSelectedGraphics([]);
  });

  sketchVM.on("update", (event) => {
    if (event.state === "complete") {
      const currentGraphics = sketchLayer.graphics.toArray();
      setGraphics(currentGraphics);
      saveGraphicsToLocalStorage(currentGraphics);
    }
  });

  return sketchVM;
}
