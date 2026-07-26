import { useEffect, useRef, useState } from "react";
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
  const saveToLocalStorage = useSceneStore((s) => s.saveToLocalStorage);
  const loadFromLocalStorage = useSceneStore((s) => s.loadFromLocalStorage);
  const hasSavedScene = useSceneStore((s) => s.hasSavedScene);
  const exportSceneJson = useSceneStore((s) => s.exportSceneJson);
  const importSceneJson = useSceneStore((s) => s.importSceneJson);
  const lastSavedAt = useSceneStore((s) => s.lastSavedAt);

  const [savedExists, setSavedExists] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSavedExists(hasSavedScene());
  }, [hasSavedScene, lastSavedAt]);

  function flashToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  function handleSave() {
    saveToLocalStorage();
    flashToast("Saved");
  }

  function handleLoad() {
    const ok = loadFromLocalStorage();
    flashToast(ok ? "Loaded saved room" : "No saved room found");
  }

  function handleExport() {
    const json = exportSceneJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `room3d-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importSceneJson(String(reader.result));
      flashToast(ok ? "Room imported" : "Couldn't read that file");
    };
    reader.readAsText(file);
  }

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
        {toast && <span className="topbar-toast">{toast}</span>}
        <button disabled={historyLen === 0} onClick={undo}>
          Undo
        </button>
        <button disabled={futureLen === 0} onClick={redo}>
          Redo
        </button>
        <span className="topbar-divider" />
        <button onClick={handleSave} title="Save to this browser">
          Save
        </button>
        <button onClick={handleLoad} disabled={!savedExists} title="Load the last saved room">
          Load
        </button>
        <button onClick={handleExport} title="Download as a .json file">
          Export file
        </button>
        <button onClick={handleImportClick} title="Load a .json file from your computer">
          Import file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />
        <span className="topbar-divider" />
        <button className="danger" onClick={resetRoom}>
          Reset room
        </button>
      </div>
    </header>
  );
}
