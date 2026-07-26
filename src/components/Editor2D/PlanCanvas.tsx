import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Group, Text, Transformer, Circle } from "react-konva";
import type Konva from "konva";
import { useSceneStore } from "../../store/sceneStore";
import { getCatalogEntry } from "../../data/furnitureCatalog";
import { formatLength } from "../../utils/units";
import type { Point } from "../../types/scene";

export const PX_PER_CM = 0.5; // 2D canvas scale: 1cm = 0.5px
const GRID_SIZE_CM = 20;
const SNAP_GRID_CM = 10;
const ANGLE_SNAP_DEG = 45;
const ANGLE_SNAP_THRESHOLD_DEG = 8;
const CLOSE_LOOP_RADIUS_PX = 14;

function toPx(cm: number) {
  return cm * PX_PER_CM;
}

type Mode = "select" | "draw-wall" | "door" | "window";

/** Snaps a freehand point to the grid, and to 45° increments relative to the previous point. */
function snapDrawPoint(prev: Point | null, raw: Point): Point {
  const gridSnapped: Point = [Math.round(raw[0] / SNAP_GRID_CM) * SNAP_GRID_CM, Math.round(raw[1] / SNAP_GRID_CM) * SNAP_GRID_CM];
  if (!prev) return gridSnapped;
  const dx = raw[0] - prev[0];
  const dz = raw[1] - prev[1];
  const len = Math.hypot(dx, dz);
  if (len < 1) return gridSnapped;
  const angleDeg = (Math.atan2(dz, dx) * 180) / Math.PI;
  const nearest = Math.round(angleDeg / ANGLE_SNAP_DEG) * ANGLE_SNAP_DEG;
  const diff = Math.abs(((angleDeg - nearest + 540) % 360) - 180);
  const useAngle = diff <= ANGLE_SNAP_THRESHOLD_DEG ? nearest : angleDeg;
  const snappedLen = Math.round(len / SNAP_GRID_CM) * SNAP_GRID_CM;
  const rad = (useAngle * Math.PI) / 180;
  return [prev[0] + Math.cos(rad) * snappedLen, prev[1] + Math.sin(rad) * snappedLen];
}

export default function PlanCanvas() {
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedId);
  const select = useSceneStore((s) => s.select);
  const updateFurniture = useSceneStore((s) => s.updateFurniture);
  const pushHistory = useSceneStore((s) => s.pushHistory);
  const addOpening = useSceneStore((s) => s.addOpening);
  const updateVertexPosition = useSceneStore((s) => s.updateVertexPosition);
  const insertVertexOnWall = useSceneStore((s) => s.insertVertexOnWall);
  const commitDrawnPolygon = useSceneStore((s) => s.commitDrawnPolygon);
  const displayUnit = useSceneStore((s) => s.displayUnit);
  const setDisplayUnit = useSceneStore((s) => s.setDisplayUnit);

  const [mode, setMode] = useState<Mode>("select");
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedShapeRef = useRef<Konva.Group>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const stageWidth = 900;
  const stageHeight = 640;

  const allX = scene.vertices.map((v) => v.point[0]);
  const allZ = scene.vertices.map((v) => v.point[1]);
  const minX = Math.min(0, ...allX, ...draftPoints.map((p) => p[0]));
  const minZ = Math.min(0, ...allZ, ...draftPoints.map((p) => p[1]));
  const offsetX = 70 - toPx(minX);
  const offsetZ = 70 - toPx(minZ);

  function cmFromEvent(clientX: number, clientY: number): Point {
    const stageEl = wrapRef.current?.querySelector("canvas");
    const rect = stageEl ? stageEl.getBoundingClientRect() : wrapRef.current!.getBoundingClientRect();
    const xPx = clientX - rect.left;
    const zPx = clientY - rect.top;
    return [(xPx - offsetX) / PX_PER_CM, (zPx - offsetZ) / PX_PER_CM];
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDraftPoints([]);
        setPreviewPoint(null);
        setMode("select");
      }
      if (e.key === "Enter" && draftPoints.length >= 3) {
        commitDrawnPolygon(draftPoints);
        setDraftPoints([]);
        setPreviewPoint(null);
        setMode("select");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draftPoints, commitDrawnPolygon]);

  function handleStageClick(rawCm: Point) {
    if (mode !== "draw-wall") return;
    const prev = draftPoints.length > 0 ? draftPoints[draftPoints.length - 1] : null;
    const snapped = snapDrawPoint(prev, rawCm);

    // Closing the loop: click near the first point after at least 3 points placed.
    if (draftPoints.length >= 3) {
      const first = draftPoints[0];
      const distPx = Math.hypot(toPx(first[0] - snapped[0]), toPx(first[1] - snapped[1]));
      if (distPx <= CLOSE_LOOP_RADIUS_PX) {
        commitDrawnPolygon(draftPoints);
        setDraftPoints([]);
        setPreviewPoint(null);
        setMode("select");
        return;
      }
    }
    setDraftPoints([...draftPoints, snapped]);
  }

  function handleWallOpeningClick(wallId: string, posAlongWall: number) {
    if (mode !== "door" && mode !== "window") return;
    const wall = scene.walls.find((w) => w.id === wallId);
    if (!wall) return;
    const width = mode === "door" ? 90 : 120;
    addOpening({
      wallId,
      type: mode,
      position: posAlongWall,
      width,
      height: mode === "door" ? 210 : 120,
      sillHeight: mode === "window" ? 90 : undefined,
      swing: mode === "door" ? "in-left" : undefined,
    });
    setMode("select");
  }

  function projectOntoWall(wallId: string, pointCm: Point) {
    const wall = scene.walls.find((w) => w.id === wallId);
    if (!wall) return null;
    const startV = scene.vertices.find((v) => v.id === wall.startVertexId);
    const endV = scene.vertices.find((v) => v.id === wall.endVertexId);
    if (!startV || !endV) return null;
    const dx = endV.point[0] - startV.point[0];
    const dz = endV.point[1] - startV.point[1];
    const len = Math.hypot(dx, dz);
    const t = ((pointCm[0] - startV.point[0]) * dx + (pointCm[1] - startV.point[1]) * dz) / (len * len);
    const clampedT = Math.max(0, Math.min(1, t));
    const posAlongWall = clampedT * len;
    const projected: Point = [startV.point[0] + (dx * posAlongWall) / len, startV.point[1] + (dz * posAlongWall) / len];
    return { posAlongWall, projected, wall };
  }

  function renderGrid() {
    const lines = [];
    for (let x = -600; x <= 1400; x += GRID_SIZE_CM) {
      lines.push(
        <Line key={`gx${x}`} points={[toPx(x) + offsetX, -600 + offsetZ, toPx(x) + offsetX, 1400 + offsetZ]} stroke="#1e222b" strokeWidth={1} />
      );
    }
    for (let z = -600; z <= 1400; z += GRID_SIZE_CM) {
      lines.push(
        <Line key={`gz${z}`} points={[-600 + offsetX, toPx(z) + offsetZ, 1400 + offsetX, toPx(z) + offsetZ]} stroke="#1e222b" strokeWidth={1} />
      );
    }
    return lines;
  }

  function renderRuler() {
    const items = [];
    for (let x = -600; x <= 1400; x += 100) {
      const px = toPx(x) + offsetX;
      items.push(<Line key={`rx${x}`} points={[px, 0, px, 10]} stroke="#5b6272" strokeWidth={1} />);
      items.push(<Text key={`rxt${x}`} x={px + 2} y={0} text={formatLength(x, displayUnit)} fontSize={9} fill="#5b6272" />);
    }
    for (let z = -600; z <= 1400; z += 100) {
      const py = toPx(z) + offsetZ;
      items.push(<Line key={`rz${z}`} points={[0, py, 10, py]} stroke="#5b6272" strokeWidth={1} />);
      items.push(<Text key={`rzt${z}`} x={12} y={py - 5} text={formatLength(z, displayUnit)} fontSize={9} fill="#5b6272" />);
    }
    return items;
  }

  const draftPreviewLine = draftPoints.length > 0 && previewPoint
    ? [toPx(draftPoints[draftPoints.length - 1][0]) + offsetX, toPx(draftPoints[draftPoints.length - 1][1]) + offsetZ, toPx(previewPoint[0]) + offsetX, toPx(previewPoint[1]) + offsetZ]
    : null;

  return (
    <div
      className="plan-canvas-wrap"
      ref={wrapRef}
      onDrop={(e) => {
        e.preventDefault();
        const catalogId = e.dataTransfer.getData("catalogId");
        if (!catalogId) return;
        const [xCm, zCm] = cmFromEvent(e.clientX, e.clientY);
        useSceneStore.getState().addFurniture(catalogId, [xCm, zCm]);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="plan-toolbar">
        <button className={mode === "draw-wall" ? "active" : ""} onClick={() => { setMode(mode === "draw-wall" ? "select" : "draw-wall"); setDraftPoints([]); }}>
          ✏️ Draw walls
        </button>
        <button className={mode === "door" ? "active" : ""} onClick={() => setMode(mode === "door" ? "select" : "door")}>
          + Door
        </button>
        <button className={mode === "window" ? "active" : ""} onClick={() => setMode(mode === "window" ? "select" : "window")}>
          + Window
        </button>
        <div className="unit-toggle">
          {(["m", "cm", "ft"] as const).map((u) => (
            <button key={u} className={displayUnit === u ? "active" : ""} onClick={() => setDisplayUnit(u)}>
              {u}
            </button>
          ))}
        </div>
        <span className="hint">
          {mode === "draw-wall" && "Click to place corners. Click near the start point (or press Enter) to close the room. Esc to cancel."}
          {mode === "door" && "Click a wall to place a door."}
          {mode === "window" && "Click a wall to place a window."}
          {mode === "select" && "Drag furniture from the catalog, or double-click a wall to add a corner."}
        </span>
      </div>
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseMove={(e) => {
          const stage = e.target.getStage();
          const pos = stage?.getPointerPosition();
          if (!pos || mode !== "draw-wall") return;
          const raw: Point = [(pos.x - offsetX) / PX_PER_CM, (pos.y - offsetZ) / PX_PER_CM];
          const prev = draftPoints.length > 0 ? draftPoints[draftPoints.length - 1] : null;
          setPreviewPoint(snapDrawPoint(prev, raw));
        }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) {
            if (mode === "draw-wall") {
              const stage = e.target.getStage();
              const pos = stage?.getPointerPosition();
              if (pos) handleStageClick([(pos.x - offsetX) / PX_PER_CM, (pos.y - offsetZ) / PX_PER_CM]);
            } else {
              select(null, null);
            }
          }
        }}
      >
        <Layer>{renderGrid()}</Layer>
        <Layer>{renderRuler()}</Layer>

        {/* Walls */}
        <Layer>
          {scene.walls.map((w) => {
            const startV = scene.vertices.find((v) => v.id === w.startVertexId);
            const endV = scene.vertices.find((v) => v.id === w.endVertexId);
            if (!startV || !endV) return null;
            const isSelected = selectedId === w.id;
            const midX = (startV.point[0] + endV.point[0]) / 2;
            const midZ = (startV.point[1] + endV.point[1]) / 2;
            const lenCm = Math.hypot(endV.point[0] - startV.point[0], endV.point[1] - startV.point[1]);
            return (
              <Group key={w.id}>
                <Line
                  points={[toPx(startV.point[0]) + offsetX, toPx(startV.point[1]) + offsetZ, toPx(endV.point[0]) + offsetX, toPx(endV.point[1]) + offsetZ]}
                  stroke={isSelected ? "#ffd166" : "#e7e9ee"}
                  strokeWidth={Math.max(4, toPx(w.thickness))}
                  lineCap="square"
                  onClick={(e) => {
                    if (mode === "door" || mode === "window") {
                      const stage = e.target.getStage();
                      const pos = stage?.getPointerPosition();
                      if (!pos) return;
                      const result = projectOntoWall(w.id, [(pos.x - offsetX) / PX_PER_CM, (pos.y - offsetZ) / PX_PER_CM]);
                      if (result) handleWallOpeningClick(w.id, result.posAlongWall);
                    } else if (mode === "select") {
                      select(w.id, "wall");
                    }
                  }}
                  onDblClick={(e) => {
                    if (mode !== "select") return;
                    const stage = e.target.getStage();
                    const pos = stage?.getPointerPosition();
                    if (!pos) return;
                    const result = projectOntoWall(w.id, [(pos.x - offsetX) / PX_PER_CM, (pos.y - offsetZ) / PX_PER_CM]);
                    if (result) insertVertexOnWall(w.id, result.projected);
                  }}
                />
                <Text
                  x={toPx(midX) + offsetX - 20}
                  y={toPx(midZ) + offsetZ - 14}
                  text={formatLength(lenCm, displayUnit)}
                  fontSize={11}
                  fill={isSelected ? "#ffd166" : "#7d8494"}
                />
              </Group>
            );
          })}
        </Layer>

        {/* Vertex handles (drag to reshape) */}
        <Layer>
          {mode === "select" &&
            scene.vertices.map((v) => (
              <Circle
                key={v.id}
                x={toPx(v.point[0]) + offsetX}
                y={toPx(v.point[1]) + offsetZ}
                radius={5}
                fill="#20242c"
                stroke="#ffd166"
                strokeWidth={1.5}
                draggable
                onDragStart={() => pushHistory()}
                onDragMove={(e) => {
                  const xCm = (e.target.x() - offsetX) / PX_PER_CM;
                  const zCm = (e.target.y() - offsetZ) / PX_PER_CM;
                  updateVertexPosition(v.id, [xCm, zCm]);
                }}
              />
            ))}
        </Layer>

        {/* In-progress freehand wall drawing */}
        <Layer>
          {draftPoints.length > 0 && (
            <Line
              points={draftPoints.flatMap((p) => [toPx(p[0]) + offsetX, toPx(p[1]) + offsetZ])}
              stroke="#5fb4d1"
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          )}
          {draftPreviewLine && (
            <>
              <Line points={draftPreviewLine} stroke="#5fb4d1" strokeWidth={2} dash={[6, 4]} />
              {previewPoint && draftPoints.length > 0 && (
                <Text
                  x={draftPreviewLine[2] + 8}
                  y={draftPreviewLine[3] - 8}
                  text={formatLength(Math.hypot(previewPoint[0] - draftPoints[draftPoints.length - 1][0], previewPoint[1] - draftPoints[draftPoints.length - 1][1]), displayUnit)}
                  fontSize={11}
                  fill="#5fb4d1"
                />
              )}
            </>
          )}
          {draftPoints.map((p, i) => (
            <Circle key={i} x={toPx(p[0]) + offsetX} y={toPx(p[1]) + offsetZ} radius={i === 0 ? 6 : 4} fill={i === 0 ? "#ffd166" : "#5fb4d1"} />
          ))}
        </Layer>

        {/* Openings */}
        <Layer>
          {scene.openings.map((o) => {
            const wall = scene.walls.find((w) => w.id === o.wallId);
            if (!wall) return null;
            const startV = scene.vertices.find((v) => v.id === wall.startVertexId);
            const endV = scene.vertices.find((v) => v.id === wall.endVertexId);
            if (!startV || !endV) return null;
            const dx = endV.point[0] - startV.point[0];
            const dz = endV.point[1] - startV.point[1];
            const len = Math.hypot(dx, dz);
            const ux = dx / len;
            const uz = dz / len;
            const cx = startV.point[0] + ux * o.position;
            const cz = startV.point[1] + uz * o.position;
            const half = o.width / 2;
            const x1 = cx - ux * half;
            const z1 = cz - uz * half;
            const x2 = cx + ux * half;
            const z2 = cz + uz * half;
            return (
              <Line
                key={o.id}
                points={[toPx(x1) + offsetX, toPx(z1) + offsetZ, toPx(x2) + offsetX, toPx(z2) + offsetZ]}
                stroke={o.type === "door" ? "#c98a4b" : "#5fb4d1"}
                strokeWidth={Math.max(6, toPx(wall.thickness))}
                lineCap="butt"
                onClick={() => mode === "select" && select(o.id, "opening")}
              />
            );
          })}
        </Layer>

        {/* Furniture */}
        <Layer>
          {scene.furniture.map((f) => {
            const entry = getCatalogEntry(f.catalogId);
            const wPx = toPx(f.footprint[0]);
            const dPx = toPx(f.footprint[1]);
            const isSelected = selectedId === f.id;
            return (
              <Group
                key={f.id}
                ref={isSelected ? selectedShapeRef : undefined}
                x={toPx(f.position[0]) + offsetX}
                y={toPx(f.position[1]) + offsetZ}
                rotation={f.rotationDeg}
                draggable={mode === "select"}
                onClick={() => mode === "select" && select(f.id, "furniture")}
                onTap={() => mode === "select" && select(f.id, "furniture")}
                onDragStart={() => pushHistory()}
                onDragEnd={(e) => {
                  const xCm = (e.target.x() - offsetX) / PX_PER_CM;
                  const zCm = (e.target.y() - offsetZ) / PX_PER_CM;
                  updateFurniture(f.id, { position: [xCm, zCm] });
                }}
                onTransformEnd={(e) => {
                  const node = e.target as unknown as Konva.Group;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  updateFurniture(f.id, {
                    footprint: [Math.max(10, f.footprint[0] * scaleX), Math.max(10, f.footprint[1] * scaleY)],
                    rotationDeg: node.rotation(),
                    position: [(node.x() - offsetX) / PX_PER_CM, (node.y() - offsetZ) / PX_PER_CM],
                  });
                }}
              >
                <Rect
                  x={-wPx / 2}
                  y={-dPx / 2}
                  width={wPx}
                  height={dPx}
                  fill={f.color}
                  stroke={isSelected ? "#ffd166" : "#1c1e24"}
                  strokeWidth={isSelected ? 2 : 1}
                  cornerRadius={3}
                  opacity={0.92}
                />
                <Text
                  text={entry?.label ?? f.label}
                  x={-wPx / 2}
                  y={-dPx / 2}
                  width={wPx}
                  height={dPx}
                  align="center"
                  verticalAlign="middle"
                  fontSize={10}
                  fill="#14161a"
                  wrap="word"
                />
              </Group>
            );
          })}
          {selectedId && selectedShapeRef.current && (
            <Transformer
              ref={transformerRef}
              nodes={[selectedShapeRef.current]}
              rotateEnabled
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
