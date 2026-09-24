import { useCallback, useEffect, useRef, useState } from "react";

import type { UseGridKeyboardParamsT, UseGridKeyboardReturnT } from "./gridEditor.types";

/**
 * Keyboard handling for a grid inside a modal.
 *
 * - Ctrl+F (Cmd+F on macOS) opens the grid's own search instead of the browser's find,
 *   which cannot search text drawn on a canvas.
 * - Escape closes one thing at a time: the search bar, then the cell editor, then the
 *   selection. Only when nothing is open does it call `onEscapeWhenIdle`, which usually
 *   asks to close the modal.
 *
 * The Escape listener runs in the capture phase on `document`, so it decides before the grid
 * or the modal sees the key.
 */
export const useGridKeyboard = ({
  isEnabled,
  hasSelection,
  onClearSelection,
  onEscapeWhenIdle,
  portalId = "portal"
}: UseGridKeyboardParamsT): UseGridKeyboardReturnT => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // The listener is attached once; refs give it the latest values without re-attaching.
  const latest = useRef({ isSearchOpen, hasSelection, onClearSelection, onEscapeWhenIdle });
  latest.current = { isSearchOpen, hasSelection, onClearSelection, onEscapeWhenIdle };

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }
      if (event.key !== "Escape") return;

      const current = latest.current;
      const stop = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      if (current.isSearchOpen) {
        stop();
        setIsSearchOpen(false);
        return;
      }

      // Glide renders the cell editor into the portal element. Let the grid close it.
      const portal = document.getElementById(portalId);
      if (portal && event.target instanceof Node && portal.contains(event.target)) return;

      if (current.hasSelection) {
        stop();
        current.onClearSelection();
        return;
      }

      if (current.onEscapeWhenIdle) {
        stop();
        current.onEscapeWhenIdle();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isEnabled, portalId]);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  return { isSearchOpen, openSearch, closeSearch };
};
