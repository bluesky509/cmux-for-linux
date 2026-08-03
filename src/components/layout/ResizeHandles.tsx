import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * The window has decorations disabled (tauri.conf.json), so the OS provides
 * no title bar or resize border. Without these, nothing ever calls
 * startResizeDragging and the window is stuck at its initial size despite
 * "resizable": true.
 */
const EDGE = 6;
const CORNER = 12;

const HANDLES: {
  direction: Parameters<ReturnType<typeof getCurrentWindow>["startResizeDragging"]>[0];
  cursor: string;
  style: React.CSSProperties;
}[] = [
  { direction: "North", cursor: "n-resize", style: { top: 0, left: CORNER, right: CORNER, height: EDGE } },
  { direction: "South", cursor: "s-resize", style: { bottom: 0, left: CORNER, right: CORNER, height: EDGE } },
  { direction: "West", cursor: "w-resize", style: { left: 0, top: CORNER, bottom: CORNER, width: EDGE } },
  { direction: "East", cursor: "e-resize", style: { right: 0, top: CORNER, bottom: CORNER, width: EDGE } },
  { direction: "NorthWest", cursor: "nw-resize", style: { top: 0, left: 0, width: CORNER, height: CORNER } },
  { direction: "NorthEast", cursor: "ne-resize", style: { top: 0, right: 0, width: CORNER, height: CORNER } },
  { direction: "SouthWest", cursor: "sw-resize", style: { bottom: 0, left: 0, width: CORNER, height: CORNER } },
  { direction: "SouthEast", cursor: "se-resize", style: { bottom: 0, right: 0, width: CORNER, height: CORNER } },
];

export default function ResizeHandles() {
  return (
    <>
      {HANDLES.map(({ direction, cursor, style }) => (
        <div
          key={direction}
          onMouseDown={(e) => {
            if (e.buttons === 1) {
              e.preventDefault();
              getCurrentWindow().startResizeDragging(direction).catch(console.error);
            }
          }}
          style={{
            position: "fixed",
            zIndex: 1000,
            cursor,
            ...style,
          }}
        />
      ))}
    </>
  );
}
