import { Component, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import type { FurnitureItem } from "../../types/scene";

const CM_TO_M = 0.01;

/**
 * Loads a real .glb model and rescales/recenters it so its bounding box
 * matches the item's footprint (width/depth) and heightCm, regardless of
 * what units/pivot the source model was authored with.
 */
function GltfFurniture({ url, item }: { url: string; item: FurnitureItem }) {
  const gltf = useGLTF(url);

  // Clone so multiple instances of the same model don't share transforms.
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const targetW = item.footprint[0] * CM_TO_M;
    const targetD = item.footprint[1] * CM_TO_M;
    const targetH = item.heightCm * CM_TO_M;

    const sx = size.x > 1e-6 ? targetW / size.x : 1;
    const sy = size.y > 1e-6 ? targetH / size.y : 1;
    const sz = size.z > 1e-6 ? targetD / size.z : 1;

    return {
      scale: [sx, sy, sz] as [number, number, number],
      // Re-center on X/Z, sit on the floor on Y (offset applied pre-scale).
      offset: [-center.x, -box.min.y, -center.z] as [number, number, number],
    };
  }, [scene, item.footprint, item.heightCm]);

  return (
    <group
      position={[item.position[0] * CM_TO_M, 0, item.position[1] * CM_TO_M]}
      rotation={[0, -(item.rotationDeg * Math.PI) / 180, 0]}
      scale={[item.flippedX ? -1 : 1, 1, 1]}
    >
      <group scale={scale}>
        <primitive object={scene} position={offset} castShadow receiveShadow />
      </group>
    </group>
  );
}

/**
 * Boundary so a broken/missing .glb (bad export, wrong path, corrupt file)
 * degrades to the fallback box instead of crashing the whole 3D viewer.
 */
export default function FurnitureModel({
  url,
  item,
  fallback,
}: {
  url: string;
  item: FurnitureItem;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (failed) return <>{fallback}</>;

  return (
    <ModelErrorCatcher onError={() => setFailed(true)} fallback={fallback}>
      <GltfFurniture url={url} item={item} />
    </ModelErrorCatcher>
  );
}

class ModelErrorCatcher extends Component<
  { children: React.ReactNode; fallback: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
