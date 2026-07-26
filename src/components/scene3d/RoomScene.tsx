"use client";
import { useMemo } from "react";
import { useRoomStore } from "../../store/roomStore";
import RoomShell from "./RoomShell";
import Furniture from "./Furniture";

export default function RoomScene() {
  const schema = useRoomStore((s) => s.schema);

  const lights = useMemo(
    () => (
      <>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 7, 5]} intensity={1.2} castShadow />
        <pointLight position={[0, 3.5, 0]} intensity={0.8} />
      </>
    ),
    []
  );

  return (
    <>
      {lights}
      <RoomShell room={schema.room} />
      {schema.furniture.map((item) => (
        <Furniture key={item.id} item={item} />
      ))}
    </>
  );
}
