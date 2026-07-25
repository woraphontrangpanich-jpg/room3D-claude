import { useSceneStore } from "../../store/sceneStore";

type ViewMode = "2d" | "3d";

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}

export default function TopBar({ view, onViewChange }: Props) {
  const undo = useSceneStore((s) => s.undo);
  const redo = useSceneStore((s) => s.redo);
  const resetRoom = useSceneStore((s) => s.resetRoom);
  const historyLen = useSceneStore((s) => s.history.length);
  const futureLen = useSceneStore((s) => s.future.length);

  return (
    <header className="topbar">
      <div className="topbar-brand">Room3D</div>
      <div className="topbar-tabs">
        <button className={view === "2d" ? "active" : ""} onClick={() => onViewChange("2d")}>
          2D Floor Plan
        </button>
        <button className={view === "3d" ? "active" : ""} onClick={() => onViewChange("3d")}>
          3D Walkthrough
        </button>
      </div>
      <div className="topbar-actions">
        <button disabled={historyLen === 0} onClick={undo}>
          Undo
        </button>
        <button disabled={futureLen === 0} onClick={redo}>
          Redo
        </button>
        <button className="danger" onClick={resetRoom}>
          Reset room
        </button>
      </div>
    </header>
  );
}
