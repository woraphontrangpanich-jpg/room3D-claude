import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import RoomMesh from "./RoomMesh";
import FurnitureMeshes from "./FurnitureMeshes";
import WalkControls from "./WalkControls";

type CameraMode = "orbit" | "walk";

export default function Viewer3D() {
  const [mode, setMode] = useState<CameraMode>("orbit");
  const controlsRef = useRef<OrbitControlsImpl>(null);

  function dollyBy(factor: number) {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object;
    const target = controls.target;
    const dir = camera.position.clone().sub(target);
    const newDist = Math.max(1.2, Math.min(20, dir.length() * factor));
    dir.normalize().multiplyScalar(newDist);
    camera.position.copy(target.clone().add(dir));
    controls.update();
  }

  return (
    <div className="viewer3d-wrap">
      <div className="viewer3d-toolbar">
        <button className={mode === "orbit" ? "active" : ""} onClick={() => setMode("orbit")}>
          Orbit view
        </button>
        <button className={mode === "walk" ? "active" : ""} onClick={() => setMode("walk")}>
          Walk inside (click to lock mouse, WASD to move)
        </button>
        {mode === "orbit" && (
          <div className="zoom-controls">
            <button onClick={() => dollyBy(1.15)} title="Zoom out">
              −
            </button>
            <button onClick={() => dollyBy(1 / 1.15)} title="Zoom in">
              +
            </button>
          </div>
        )}
      </div>
      <Canvas shadows camera={{ position: [6, 4, 6], fov: 55 }}>
        <Sky sunPosition={[10, 12, 8]} turbidity={4} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <RoomMesh />
        <FurnitureMeshes />
        {mode === "orbit" && (
          <OrbitControls
            ref={controlsRef}
            target={[2.5, 1, 2]}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={1.2}
            maxDistance={20}
          />
        )}
        <WalkControls enabled={mode === "walk"} />
      </Canvas>
    </div>
  );
}
