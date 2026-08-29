// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// --- Mocks de las dependencias externas del hook ---
const cerrarSesionMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../features/auth/authStore", () => ({
  useAuthStore: (selector) => selector({ cerrarSesion: cerrarSesionMock })
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock
}));

vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) }
}));

import { useInactividad } from "../useInactividad";

const DIEZ_MIN = 10 * 60 * 1000;

describe("useInactividad", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    cerrarSesionMock.mockClear();
    navigateMock.mockClear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test("NO cierra sesion antes de los 10 minutos", () => {
    renderHook(() => useInactividad());
    act(() => {
      vi.advanceTimersByTime(DIEZ_MIN - 1000); // 9 min 59 s
    });
    expect(cerrarSesionMock).not.toHaveBeenCalled();
  });

  test("al desmontar limpia el timer (no cierra despues de desmontado)", () => {
    const { unmount } = renderHook(() => useInactividad());
    unmount();
    act(() => {
      vi.advanceTimersByTime(DIEZ_MIN * 2);
    });
    expect(cerrarSesionMock).not.toHaveBeenCalled();
  });

  test("registra la ultima actividad en localStorage al montar", () => {
    renderHook(() => useInactividad());
    const valor = localStorage.getItem("stockalert-ultima-actividad");
    expect(valor).not.toBeNull();
    expect(Number(valor)).toBeGreaterThan(0);
  });
});
