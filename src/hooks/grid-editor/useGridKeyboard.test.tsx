import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseGridKeyboardParamsT } from "./gridEditor.types";
import { useGridKeyboard } from "./useGridKeyboard";

const press = (key: string, target: EventTarget = document.body, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
};

const setup = (overrides: Partial<UseGridKeyboardParamsT> = {}) => {
  const params = {
    isEnabled: true,
    hasSelection: false,
    onClearSelection: vi.fn(),
    onEscapeWhenIdle: vi.fn(),
    ...overrides
  };
  const hook = renderHook((props: UseGridKeyboardParamsT) => useGridKeyboard(props), {
    initialProps: params
  });
  return { ...hook, params };
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useGridKeyboard", () => {
  it("opens the grid search on Ctrl+F and blocks the browser's find", () => {
    const { result } = setup();
    const event = press("f", document.body, { ctrlKey: true });

    expect(result.current.isSearchOpen).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it("closes the search first", () => {
    const { result, params } = setup({ hasSelection: true });
    act(() => result.current.openSearch());
    press("Escape");

    expect(result.current.isSearchOpen).toBe(false);
    expect(params.onClearSelection).not.toHaveBeenCalled();
    expect(params.onEscapeWhenIdle).not.toHaveBeenCalled();
  });

  it("leaves Escape to the cell editor when the editor is open", () => {
    const portal = document.createElement("div");
    portal.id = "portal";
    const input = document.createElement("input");
    portal.appendChild(input);
    document.body.appendChild(portal);
    const { params } = setup({ hasSelection: true });

    const event = press("Escape", input);

    expect(event.defaultPrevented).toBe(false);
    expect(params.onClearSelection).not.toHaveBeenCalled();
  });

  it("clears the selection before closing", () => {
    const { params } = setup({ hasSelection: true });
    press("Escape");

    expect(params.onClearSelection).toHaveBeenCalledOnce();
    expect(params.onEscapeWhenIdle).not.toHaveBeenCalled();
  });

  it("asks to close when nothing is open", () => {
    const { params } = setup();
    press("Escape");

    expect(params.onEscapeWhenIdle).toHaveBeenCalledOnce();
  });

  it("stops Escape reaching handlers further down, such as a modal's", () => {
    setup();
    const modalHandler = vi.fn();
    document.body.addEventListener("keydown", modalHandler);
    press("Escape");
    document.body.removeEventListener("keydown", modalHandler);

    expect(modalHandler).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const { result, params } = setup({ isEnabled: false });
    press("Escape");
    press("f", document.body, { metaKey: true });

    expect(params.onEscapeWhenIdle).not.toHaveBeenCalled();
    expect(result.current.isSearchOpen).toBe(false);
  });

  it("uses the latest selection state without re-attaching", () => {
    const { rerender, params } = setup();
    rerender({ ...params, hasSelection: true });
    press("Escape");

    expect(params.onClearSelection).toHaveBeenCalledOnce();
  });
});
