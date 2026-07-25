import { useRef, useState } from "react";
import { Stage, Layer, Line, Rect, Group, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { useSceneStore } from "../../store/sceneStore";
import { getCatalogEntry } from "../../data/furnitureCatalog";

export const PX_PER_CM = 0.5; // 2D canvas scale: 1cm = 0.5px
const GRID_SIZE_CM = 20;

function toPx(cm: number) {
  return cm * PX_PER_CM;
}

export default function PlanCanvas() {
  const scene = useSceneStore((s) => s.scene);
  const selectedId = useSceneStore((s) => s.selectedId);
  const select = useSceneStore((s) => s.select);
  const updateFurniture = useSceneStore((s) => s.updateFurniture);
  const pushHistory = useSceneStore((s) => s.pushHistory);
  const addOpening = useSceneStore((s) => s.addOpening);

  const [openingMode, setOpeningMode] = useState<"door" | "window" | null>(null);
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
          className={openingMode === "door" ? "active" : ""}
          onClick={() => setOpeningMode(openingMode === "door" ? null : "door")}
        >
          + Door (click a wall)
        </button>
        <button
          className={openingMode === "window" ? "active" : ""}
          onClick={() => setOpeningMode(openingMode === "window" ? null : "window")}
        >
          + Window (click a wall)
        </button>
        <span className="hint">{openingMode ? "Click a wall to place it, or press Esc." : "Drag furniture from the catalog onto the room →"}</span>
      </div>
      <Stage
        width={stageWidth}
        height={stageHeight}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) select(null, null);
        }}
      >
        <Layer>{renderGrid()}</Layer>

        {/* Walls */}
        <Layer>
          {scene.walls.map((w) => (
            <Line
              key={w.id}
              points={[toPx(w.start[0]) + offsetX, toPx(w.start[1]) + offsetZ, toPx(w.end[0]) + offsetX, toPx(w.end[1]) + offsetZ]}
              stroke="#e7e9ee"
              strokeWidth={Math.max(4, toPx(w.thickness))}
              lineCap="square"
              onClick={(e) => {
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
                handleWallClick(w.id, posAlongWall);
              }}
            />
          ))}
        </Layer>

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
                onClick={() => select(o.id, "opening")}
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
                draggable
                onClick={() => select(f.id, "furniture")}
                onTap={() => select(f.id, "furniture")}
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
          {selectedId && (
            <Transformer
              ref={transformerRef}
              nodes={selectedShapeRef.current ? [selectedShapeRef.current] : []}
              rotateEnabled
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
