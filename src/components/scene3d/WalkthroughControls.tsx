"use client";
import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useRoomStore } from "../../store/roomStore";

const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.3;
const SPEED = 3.0;

export default function WalkthroughControls() {
  const { camera } = useThree();
  const schema = useRoomStore((s) => s.schema);
  const setViewMode = useRoomStore((s) => s.setViewMode);
  const moveRef = useRef({ forward: false, back: false, left: false, right: false });
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    camera.position.set(0, PLAYER_HEIGHT, 1.5);
  }, [camera]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setLocked(false);
      }
      if (e.code === "KeyF") {
        setLocked(true);
      }
      if (e.code === "KeyM") {
        setViewMode("orbit3d");
      }
      if (e.code === "KeyW") moveRef.current.forward = true;
      if (e.code === "KeyS") moveRef.current.back = true;
      if (e.code === "KeyA") moveRef.current.left = true;
      if (e.code === "KeyD") moveRef.current.right = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW") moveRef.current.forward = false;
      if (e.code === "KeyS") moveRef.current.back = false;
      if (e.code === "KeyA") moveRef.current.left = false;
      if (e.code === "KeyD") moveRef.current.right = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [setViewMode]);

  function checkCollision(pos: THREE.Vector3) {
    const { width, depth, wallThickness } = schema.room;
    return (
      pos.x < -width / 2 + PLAYER_RADIUS + wallThickness ||
      pos.x > width / 2 - PLAYER_RADIUS - wallThickness ||
      pos.z < -depth / 2 + PLAYER_RADIUS + wallThickness ||
      pos.z > depth / 2 - PLAYER_RADIUS - wallThickness
    );
  }

  useFrame((_, delta) => {
    if (!locked) return;

    const forward = (moveRef.current.forward ? 1 : 0) - (moveRef.current.back ? 1 : 0);
    const right = (moveRef.current.right ? 1 : 0) - (moveRef.current.left ? 1 : 0);
    const direction = new THREE.Vector3(right, 0, forward).normalize();
    const next = camera.position.clone().addScaledVector(direction, SPEED * delta);

    if (!checkCollision(next)) {
      camera.position.addScaledVector(direction, SPEED * delta);
    }
    camera.position.y = PLAYER_HEIGHT;
  });

  return <PointerLockControls onLock={() => setLocked(true)} onUnlock={() => setLocked(false)} />;
}
