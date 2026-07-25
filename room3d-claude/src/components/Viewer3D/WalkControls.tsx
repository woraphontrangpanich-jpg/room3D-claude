import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore } from "../../store/sceneStore";

const CM_TO_M = 0.01;
const EYE_HEIGHT = 1.65; // meters
const MOVE_SPEED = 2.4; // m/s
const PLAYER_RADIUS = 0.3; // meters, simple circular collider

export default function WalkControls({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const keys = useRef<Record<string, boolean>>({});
  const scene = useSceneStore((s) => s.scene);

  useEffect(() => {
    if (!enabled) return;
    camera.position.set(camera.position.x, EYE_HEIGHT, camera.position.z);
    const down = (e: KeyboardEvent) => (keys.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [enabled, camera]);

  // Build simple AABB colliders (in meters, XZ plane) for walls & furniture.
  function getColliders() {
    const boxes: THREE.Box2[] = [];
    for (const w of scene.walls) {
      const x1 = w.start[0] * CM_TO_M;
      const z1 = w.start[1] * CM_TO_M;
      const x2 = w.end[0] * CM_TO_M;
      const z2 = w.end[1] * CM_TO_M;
      const t = (w.thickness * CM_TO_M) / 2;
      const minX = Math.min(x1, x2) - t;
      const maxX = Math.max(x1, x2) + t;
      const minZ = Math.min(z1, z2) - t;
      const maxZ = Math.max(z1, z2) + t;
      boxes.push(new THREE.Box2(new THREE.Vector2(minX, minZ), new THREE.Vector2(maxX, maxZ)));
    }
    for (const f of scene.furniture) {
      const hw = (f.footprint[0] * CM_TO_M) / 2;
      const hd = (f.footprint[1] * CM_TO_M) / 2;
      const cx = f.position[0] * CM_TO_M;
      const cz = f.position[1] * CM_TO_M;
      // Ignoring rotation for collision simplicity — axis-aligned box is a fair MVP approximation.
      boxes.push(new THREE.Box2(new THREE.Vector2(cx - hw, cz - hd), new THREE.Vector2(cx + hw, cz + hd)));
    }
    return boxes;
  }

  useFrame((_, delta) => {
    if (!enabled || !controlsRef.current?.isLocked) return;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();

    let move = new THREE.Vector3();
    if (keys.current["KeyW"] || keys.current["ArrowUp"]) move.add(forward);
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) move.sub(forward);
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) move.add(right);
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) move.sub(right);
    if (move.lengthSq() === 0) return;

    move.normalize().multiplyScalar(MOVE_SPEED * delta);
    const nextPos = camera.position.clone().add(move);

    // Very simple collision: reject the move on an axis if it would land inside a collider.
    const boxes = getColliders();
    const point = new THREE.Vector2(nextPos.x, nextPos.z);
    const blocked = boxes.some((b) => {
      const expanded = new THREE.Box2(
        b.min.clone().subScalar(PLAYER_RADIUS),
        b.max.clone().addScalar(PLAYER_RADIUS)
      );
      return expanded.containsPoint(point);
    });

    if (!blocked) {
      camera.position.x = nextPos.x;
      camera.position.z = nextPos.z;
    }
    camera.position.y = EYE_HEIGHT;
  });

  if (!enabled) return null;
  return <PointerLockControls ref={controlsRef} />;
}
