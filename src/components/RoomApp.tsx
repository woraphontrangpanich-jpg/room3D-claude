"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRoomStore } from "../store/roomStore";
import RoomScene from "./scene3d/RoomScene";
import WalkthroughControls from "./scene3d/WalkthroughControls";
import PlanEditor2D from "./editor2d/PlanEditor2D";
import Toolbar from "./ui/Toolbar";
import PropertyPanel from "./ui/PropertyPanel";

export default function RoomApp() {
  const viewMode = useRoomStore((s) => s.viewMode);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#111827" }}>
      <Toolbar />
      <PropertyPanel />
      {viewMode === "plan2d" && <PlanEditor2D />}
      <Canvas shadows camera={{ position: [4, 2.8, 6], fov: 55 }} style={{ background: "#0f172a" }}>
        <color attach="background" args={["#0f172a"]} />
        <RoomScene />
        {viewMode === "walkthrough" ? (
          <WalkthroughControls />
        ) : (
          <OrbitControls
            target={[0, 1, 0]}
            maxPolarAngle={Math.PI / 2.05}
            minDistance={1.5}
            maxDistance={12}
            enableDamping
          />
        )}
      </Canvas>
    </div>
  );
}
