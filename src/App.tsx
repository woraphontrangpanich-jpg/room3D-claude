import { useState } from "react";
import TopBar from "./components/Layout/TopBar";
import PlanCanvas from "./components/Editor2D/PlanCanvas";
import CatalogPanel from "./components/Editor2D/CatalogPanel";
import Inspector from "./components/Editor2D/Inspector";
import Viewer3D from "./components/Viewer3D/Viewer3D";

type ViewMode = "2d" | "3d";

export default function App() {
  const [view, setView] = useState<ViewMode>("2d");

  return (
    <div className="app-shell">
      <TopBar view={view} onViewChange={setView} />
      {view === "2d" ? (
        <div className="editor-layout">
          <CatalogPanel />
          <PlanCanvas />
          <Inspector />
        </div>
      ) : (
        <Viewer3D />
      )}
    </div>
  );
}
