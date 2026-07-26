import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Circle, Group, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { useSceneStore } from "../../store/sceneStore";
import { getCatalogEntry } from "../../data/furnitureCatalog";
import { formatLength } from "../../utils/units";
import type { Point } from "../../types/scene";

export const PX_PER_CM = 0.5; // 2D canvas scale: 1cm = 0.5px
const GRID_SIZE_CM = 20;
const SNAP_CLOSE_PX = 14; // click-near-start distance (px) that closes the loop
const DEFAULT_WALL_THICKNESS = 12;
const DEFAULT_WALL_HEIGHT = 260;

const SNAP_ANGLE_TOLERANCE_DEG = 5; // auto-straighten: snap to 0/90/180/270 within this tolerance

function toPx(cm: number) {
  return cm * PX_PER_CM;
}

/** If the segment from `from` to `to` is close to horizontal/vertical, snap it exactly straight. */
function snapToAxis(from: Point, to: Point): Point {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const dist = Math.hypot(dx, dz);
  if (dist < 1e-6) return to;
  const angleDeg = (Math.atan2(dz, dx) * 180) / Math.PI; // -180..180
  const nearest90 = Math.round(angleDeg / 90) * 90;
  if (Math.abs(angleDeg - nearest90) <= SNAP_ANGLE_TOLERANCE_DEG) {
    const rad = (nearest90 * Math.PI) / 180;
    return [from[0] + Math.cos(rad) * dist, from[1] + Math.sin(rad) * dist];
  }
  return to;
}

type DrawMode = "wall" | "glassWall" | null;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

function clampZoom(z: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
}

export default function PlanCanvas() {
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedId);
  const selectedKind = useSceneStore((s) => s.selectedKind);
  const select = useSceneStore((s) => s.select);
  const updateFurniture = useSceneStore((s) => s.updateFurniture);
  const pushHistory = useSceneStore((s) => s.pushHistory);
  const addOpening = useSceneStore((s) => s.addOpening);
  const addWalls = useSceneStore((s) => s.addWalls);
  const loadSampleRoom = useSceneStore((s) => s.loadSampleRoom);
  const removeWall = useSceneStore((s) => s.removeWall);
  const removeOpening = useSceneStore((s) => s.removeOpening);
  const removeFurniture = useSceneStore((s) => s.removeFurniture);
  const displayUnit = useSceneStore((s) => s.displayUnit);
  const setDisplayUnit = useSceneStore((s) => s.setDisplayUnit);

  const [openingMode, setOpeningMode] = useState<"door" | "window" | null>(null);
  const [removeMode, setRemoveMode] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [drawPoints, setDrawPoints] = useState<Point[]>([]);
  const [cursorCm, setCursorCm] = useState<Point | null>(null);
  const [zoom, setZoom] = useState(1);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedShapeRef = useRef<Konva.Group>(null);

  const stageWidth = 900;
  const stageHeight = 640;

  // Bounding box of the room, used to center it in the canvas.
  const allX = scene.walls.flatMap((w) => [w.start[0], w.end[0]]);
  const allZ = scene.walls.flatMap((w) => [w.start[1], w.end[1]]);
  const minX = Math.min(0, ...allX);
  const minZ = Math.min(0, ...allZ);
  const offsetX = 60 - toPx(minX);
  const offsetZ = 60 - toPx(minZ);

  function finishWallDrawing(closeLoop: boolean) {
    if (drawPoints.length < 2) {
      setDrawPoints([]);
      setDrawMode(null);
      return;
    }
    const points = closeLoop ? [...drawPoints, drawPoints[0]] : drawPoints;
    const newWalls = [];
    for (let i = 0; i < points.length - 1; i++) {
      newWalls.push({
        start: points[i],
        end: points[i + 1],
        thickness: DEFAULT_WALL_THICKNESS,
        height: DEFAULT_WALL_HEIGHT,
        isGlass: drawMode === "glassWall",
      });
    }
    addWalls(newWalls);
    setDrawPoints([]);
    setDrawMode(null);
  }

  function cancelWallDrawing() {
    setDrawPoints([]);
    setDrawMode(null);
  }

  function handleStageClick(xCm: number, zCm: number) {
    if (!drawMode) return;
    const rawPoint: Point = [xCm, zCm];
    const snappedPoint = drawPoints.length > 0 ? snapToAxis(drawPoints[drawPoints.length - 1], rawPoint) : rawPoint;

    if (drawPoints.length >= 1) {
      const first = drawPoints[0];
      const firstPx = { x: toPx(first[0]) + offsetX, y: toPx(first[1]) + offsetZ };
      const clickPx = { x: toPx(snappedPoint[0]) + offsetX, y: toPx(snappedPoint[1]) + offsetZ };
      const dist = Math.hypot(firstPx.x - clickPx.x, firstPx.y - clickPx.y);
      if (drawPoints.length >= 2 && dist <= SNAP_CLOSE_PX) {
        finishWallDrawing(true);
        return;
      }
    }
    setDrawPoints((pts) => [...pts, snappedPoint]);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setRemoveMode(false);
        setOpeningMode(null);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!drawMode) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter") finishWallDrawing(false);
      if (e.key === "Escape") cancelWallDrawing();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawMode, drawPoints]);

  function handleWallClick(wallId: string, clickXCm: number) {
    if (!openingMode) return;
    const wall = scene.walls.find((w) => w.id === wallId);
    if (!wall) return;
    const width = openingMode === "door" ? 90 : 120;
    addOpening({
      wallId,
      type: openingMode,
      position: clickXCm,
      width,
      height: openingMode === "door" ? 210 : 120,
      sillHeight: openingMode === "window" ? 90 : undefined,
      swing: openingMode === "door" ? "in-left" : undefined,
    });
    setOpeningMode(null);
  }

  useEffect(() => {
    if (selectedKind !== "furniture") return;
    const tr = transformerRef.current;
    const node = selectedShapeRef.current;
    if (tr && node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, selectedKind]);

  function renderRuler() {
    const items = [];
    for (let x = -400; x <= 1200; x += 100) {
      const px = toPx(x) + offsetX;
      items.push(<Line key={`rx${x}`} points={[px, 0, px, 10]} stroke="#5b6272" strokeWidth={1} />);
      items.push(<Text key={`rxt${x}`} x={px + 2} y={0} text={formatLength(x, displayUnit)} fontSize={9} fill="#5b6272" />);
    }
    for (let z = -400; z <= 1200; z += 100) {
      const py = toPx(z) + offsetZ;
      items.push(<Line key={`rz${z}`} points={[0, py, 10, py]} stroke="#5b6272" strokeWidth={1} />);
      items.push(<Text key={`rzt${z}`} x={12} y={py - 5} text={formatLength(z, displayUnit)} fontSize={9} fill="#5b6272" />);
    }
    return items;
  }

  function renderGrid() {
    const lines = [];
    for (let x = -400; x <= 1200; x += GRID_SIZE_CM) {
      lines.push(
        <Line key={`gx${x}`} points={[toPx(x) + offsetX, -400 + offsetZ, toPx(x) + offsetX, 1200 + offsetZ]} stroke="#232733" strokeWidth={1} />
      );
    }
    for (let z = -400; z <= 1200; z += GRID_SIZE_CM) {
      lines.push(
        <Line key={`gz${z}`} points={[-400 + offsetX, toPx(z) + offsetZ, 1200 + offsetX, toPx(z) + offsetZ]} stroke="#232733" strokeWidth={1} />
      );
    }
    return lines;
  }

  const wrapRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="plan-canvas-wrap"
      ref={wrapRef}
      onDrop={(e) => {
        e.preventDefault();
        const catalogId = e.dataTransfer.getData("catalogId");
        if (!catalogId || !wrapRef.current) return;
        const stageEl = wrapRef.current.querySelector("canvas");
        const canvasRect = stageEl ? stageEl.getBoundingClientRect() : wrapRef.current.getBoundingClientRect();
        const xPx = e.clientX - canvasRect.left;
        const zPx = e.clientY - canvasRect.top;
        const xCm = (xPx - offsetX) / PX_PER_CM;
        const zCm = (zPx - offsetZ) / PX_PER_CM;
        useSceneStore.getState().addFurniture(catalogId, [xCm, zCm]);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="plan-toolbar">
        <button
          className={drawMode === "wall" ? "active" : ""}
          onClick={() => {
            if (drawMode === "wall") {
              cancelWallDrawing();
            } else {
              setOpeningMode(null);
              setRemoveMode(false);
              setDrawMode("wall");
              setDrawPoints([]);
            }
          }}
        >
          + Draw wall
        </button>
        <button
          className={drawMode === "glassWall" ? "active" : ""}
          onClick={() => {
            if (drawMode === "glassWall") {
              cancelWallDrawing();
            } else {
              setOpeningMode(null);
              setRemoveMode(false);
              setDrawMode("glassWall");
              setDrawPoints([]);
            }
          }}
        >
          + Draw glass wall
        </button>
        <button
          className={openingMode === "door" ? "active" : ""}
          onClick={() => {
            setRemoveMode(false);
            setOpeningMode(openingMode === "door" ? null : "door");
          }}
        >
          + Door (click a wall)
        </button>
        <button
          className={openingMode === "window" ? "active" : ""}
          onClick={() => {
            setRemoveMode(false);
            setOpeningMode(openingMode === "window" ? null : "window");
          }}
        >
          + Window (click a wall)
        </button>
        <button onClick={loadSampleRoom}>Load sample room</button>
        <button
          className={removeMode ? "active danger" : ""}
          onClick={() => {
            setRemoveMode(!removeMode);
            setOpeningMode(null);
            setDrawMode(null);
            setDrawPoints([]);
          }}
        >
          Remove (click item)
        </button>
        <div className="unit-toggle">
          {(["m", "cm", "ft"] as const).map((u) => (
            <button key={u} className={displayUnit === u ? "active" : ""} onClick={() => setDisplayUnit(u)}>
              {u}
            </button>
          ))}
        </div>
        <div className="zoom-controls">
          <button onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))} title="Zoom out">
            −
          </button>
          <button className="zoom-reset" onClick={() => setZoom(1)} title="Reset zoom">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))} title="Zoom in">
            +
          </button>
        </div>
        <span className="hint">
          {drawMode
            ? "Click to place wall points. Click near the start to close the loop, Enter to finish open, Esc to cancel."
            : removeMode
            ? "Click a wall, door, window, or furniture piece to remove it. Walls delete only that segment."
            : openingMode
            ? "Click a wall to place it, or press Esc."
            : "Drag furniture from the catalog onto the room →"}
        </span>
      </div>
      <Stage
        width={stageWidth}
        height={stageHeight}
        scaleX={zoom}
        scaleY={zoom}
        onWheel={(e) => {
          e.evt.preventDefault();
          setZoom((z) => clampZoom(z + (e.evt.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)));
        }}
        onMouseMove={(e) => {
          if (!drawMode) return;
          const stage = e.target.getStage();
          const pos = stage?.getPointerPosition();
          if (!pos) return;
          const raw: Point = [(pos.x - offsetX) / PX_PER_CM, (pos.y - offsetZ) / PX_PER_CM];
          const snapped = drawPoints.length > 0 ? snapToAxis(drawPoints[drawPoints.length - 1], raw) : raw;
          setCursorCm(snapped);
        }}
        onMouseDown={(e) => {
          if (drawMode) {
            const stage = e.target.getStage();
            const pos = stage?.getPointerPosition();
            if (!pos) return;
            const xCm = (pos.x - offsetX) / PX_PER_CM;
            const zCm = (pos.y - offsetZ) / PX_PER_CM;
            handleStageClick(xCm, zCm);
            return;
          }
          if (e.target === e.target.getStage()) select(null, null);
        }}
        onDblClick={() => {
          if (drawMode) finishWallDrawing(false);
        }}
      >
        <Layer>{renderGrid()}</Layer>
        <Layer listening={false}>{renderRuler()}</Layer>

        {/* Walls */}
        <Layer>
          {scene.walls.map((w) => {
            const isSelected = selectedId === w.id;
            const midX = (w.start[0] + w.end[0]) / 2;
            const midZ = (w.start[1] + w.end[1]) / 2;
            const lenCm = Math.hypot(w.end[0] - w.start[0], w.end[1] - w.start[1]);
            return (
              <Group key={w.id}>
                <Line
                  points={[toPx(w.start[0]) + offsetX, toPx(w.start[1]) + offsetZ, toPx(w.end[0]) + offsetX, toPx(w.end[1]) + offsetZ]}
                  stroke={isSelected ? "#ffd166" : w.isGlass ? "#7fd0e6" : "#e7e9ee"}
                  strokeWidth={Math.max(4, toPx(w.thickness))}
                  opacity={w.isGlass ? 0.55 : 1}
                  lineCap="square"
                  onClick={(e) => {
                    if (drawMode) return;
                    e.cancelBubble = true;
                    if (removeMode) {
                      removeWall(w.id);
                      return;
                    }
                    const stage = e.target.getStage();
                    if (!stage) return;
                    const pos = stage.getPointerPosition();
                    if (!pos) return;
                    const wx = (pos.x - offsetX) / PX_PER_CM;
                    const wz = (pos.y - offsetZ) / PX_PER_CM;
                    const dx = w.end[0] - w.start[0];
                    const dz = w.end[1] - w.start[1];
                    const len = Math.hypot(dx, dz);
                    const t = ((wx - w.start[0]) * dx + (wz - w.start[1]) * dz) / (len * len);
                    const posAlongWall = Math.max(0, Math.min(len, t * len));
                    if (openingMode) {
                      handleWallClick(w.id, posAlongWall);
                    } else {
                      select(w.id, "wall");
                    }
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

        {/* Wall drawing preview */}
        {drawMode && (
          <Layer listening={false}>
            {drawPoints.length > 0 && cursorCm && (
              <>
                <Line
                  points={[
                    toPx(drawPoints[drawPoints.length - 1][0]) + offsetX,
                    toPx(drawPoints[drawPoints.length - 1][1]) + offsetZ,
                    toPx(cursorCm[0]) + offsetX,
                    toPx(cursorCm[1]) + offsetZ,
                  ]}
                  stroke={drawMode === "glassWall" ? "#7fd0e6" : "#8fd6a8"}
                  strokeWidth={2}
                  dash={[6, 4]}
                />
                <Text
                  x={toPx((drawPoints[drawPoints.length - 1][0] + cursorCm[0]) / 2) + offsetX - 20}
                  y={toPx((drawPoints[drawPoints.length - 1][1] + cursorCm[1]) / 2) + offsetZ - 14}
                  text={formatLength(
                    Math.hypot(cursorCm[0] - drawPoints[drawPoints.length - 1][0], cursorCm[1] - drawPoints[drawPoints.length - 1][1]),
                    displayUnit
                  )}
                  fontSize={11}
                  fill={drawMode === "glassWall" ? "#7fd0e6" : "#8fd6a8"}
                />
              </>
            )}
            {drawPoints.length > 1 &&
              drawPoints.slice(1).map((p, i) => {
                const prev = drawPoints[i];
                const lenCm = Math.hypot(p[0] - prev[0], p[1] - prev[1]);
                const midX = (prev[0] + p[0]) / 2;
                const midZ = (prev[1] + p[1]) / 2;
                return (
                  <Text
                    key={`draw-seg-${i}`}
                    x={toPx(midX) + offsetX - 20}
                    y={toPx(midZ) + offsetZ - 14}
                    text={formatLength(lenCm, displayUnit)}
                    fontSize={11}
                    fill={drawMode === "glassWall" ? "#7fd0e6" : "#8fd6a8"}
                  />
                );
              })}
            {drawPoints.length > 1 && (
              <Line
                points={drawPoints.flatMap((p) => [toPx(p[0]) + offsetX, toPx(p[1]) + offsetZ])}
                stroke={drawMode === "glassWall" ? "#7fd0e6" : "#8fd6a8"}
                strokeWidth={Math.max(4, toPx(DEFAULT_WALL_THICKNESS))}
                lineCap="square"
                lineJoin="round"
              />
            )}
            {drawPoints.map((p, i) => (
              <Circle
                key={i}
                x={toPx(p[0]) + offsetX}
                y={toPx(p[1]) + offsetZ}
                radius={i === 0 ? 6 : 4}
                fill={i === 0 ? "#ffd166" : "#8fd6a8"}
                stroke="#14161a"
                strokeWidth={1}
              />
            ))}
          </Layer>
        )}

        {/* Openings */}
        <Layer>
          {scene.openings.map((o) => {
            const wall = scene.walls.find((w) => w.id === o.wallId);
            if (!wall) return null;
            const dx = wall.end[0] - wall.start[0];
            const dz = wall.end[1] - wall.start[1];
            const len = Math.hypot(dx, dz);
            const ux = dx / len;
            const uz = dz / len;
            const cx = wall.start[0] + ux * o.position;
            const cz = wall.start[1] + uz * o.position;
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
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (removeMode) {
                    removeOpening(o.id);
                    return;
                  }
                  if (!drawMode) select(o.id, "opening");
                }}
              />
            );
          })}
        </Layer>

        {/* Furniture */}
        <Layer listening={!drawMode}>
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
                scaleX={f.flippedX ? -1 : 1}
                draggable={!drawMode}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (removeMode) {
                    removeFurniture(f.id);
                    return;
                  }
                  select(f.id, "furniture");
                }}
                onTap={(e) => {
                  e.cancelBubble = true;
                  if (removeMode) {
                    removeFurniture(f.id);
                    return;
                  }
                  select(f.id, "furniture");
                }}
                onDragStart={() => pushHistory()}
                onTransformStart={() => pushHistory()}
                onDragEnd={(e) => {
                  const xCm = (e.target.x() - offsetX) / PX_PER_CM;
                  const zCm = (e.target.y() - offsetZ) / PX_PER_CM;
                  updateFurniture(f.id, { position: [xCm, zCm] });
                }}
                onTransformEnd={(e) => {
                  const node = e.target as unknown as Konva.Group;
                  const flipBase = f.flippedX ? -1 : 1;
                  // scaleX carries the flip sign too, so divide it back out before
                  // applying to footprint width (footprint itself is never negative).
                  const scaleX = node.scaleX() / flipBase;
                  const scaleY = node.scaleY();
                  node.scaleX(flipBase);
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
          {selectedKind === "furniture" && (
            <Transformer
              ref={transformerRef}
              rotateEnabled
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) return oldBox;
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
