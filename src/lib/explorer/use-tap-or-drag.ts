import { useState } from "react";

/**
 * Shared interaction for Explorer sorting/placing activities: native HTML5
 * drag-and-drop for mouse users who want it, with tap-to-select then
 * tap-to-place as the primary, fully-equivalent path everyone else uses
 * (touch devices don't reliably support HTML5 DnD at all, and it has no
 * keyboard/screen-reader equivalent on its own — so tap must never be a
 * second-class fallback, only an additional entry point into the exact
 * same `place(id)` action a real pointer-drag also calls).
 */
export function useTapOrDrag<T extends string>() {
  const [selected, setSelected] = useState<T | null>(null);

  const dragSource = (id: T) => ({
    draggable: true,
    onDragStart: (event: React.DragEvent) => {
      event.dataTransfer.setData("text/plain", id);
      event.dataTransfer.effectAllowed = "move";
    },
  });

  const dropTarget = (onDrop: (id: T) => void) => ({
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      const id = event.dataTransfer.getData("text/plain") as T;
      if (id) onDrop(id);
    },
  });

  return { selected, setSelected, dragSource, dropTarget };
}
