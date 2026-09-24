import { useCallback, useState } from "react";

import type { UseGridSaveParamsT, UseGridSaveReturnT } from "./gridEditor.types";
import { useGridEditor } from "./GridEditorContext";
import {
  DEFAULT_MAX_PAYLOAD_BYTES,
  estimatePayloadBytes,
  formatMegabytes
} from "./utils/estimatePayloadBytes";

/**
 * Sends every pending change in one request.
 *
 * The request is size-checked before it is sent. Pending changes are cleared only after the
 * server accepts them, so a failed save loses nothing.
 */
export const useGridSave = ({
  onSave,
  maxPayloadBytes = DEFAULT_MAX_PAYLOAD_BYTES
}: UseGridSaveParamsT): UseGridSaveReturnT => {
  const { dispatch, saveRequest, hasChanges } = useGridEditor();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (!hasChanges) return false;
    setError(null);

    const bytes = estimatePayloadBytes(saveRequest);
    if (bytes > maxPayloadBytes) {
      setError(
        `These changes are ${formatMegabytes(bytes)}, over the ${formatMegabytes(maxPayloadBytes)} limit. Save in smaller batches.`
      );
      return false;
    }

    setIsSaving(true);
    try {
      await onSave(saveRequest);
      dispatch({ type: "saved", request: saveRequest });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, hasChanges, maxPayloadBytes, onSave, saveRequest]);

  const clearError = useCallback(() => setError(null), []);

  return { save, isSaving, error, clearError };
};
