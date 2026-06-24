import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';

describe('useDebounce — retraso de valor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('retorna el valor inicial inmediatamente', () => {
    const { result } = renderHook(() => useDebounce('inicial', 300));
    expect(result.current).toBe('inicial');
  });

  test('no actualiza el valor antes de que transcurra el delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'inicio' },
    });

    rerender({ value: 'nuevo' });
    act(() => { vi.advanceTimersByTime(200); });

    expect(result.current).toBe('inicio');
  });

  test('actualiza el valor después de que transcurre el delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'inicio' },
    });

    rerender({ value: 'nuevo' });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe('nuevo');
  });

  test('solo emite el último valor si cambia varias veces antes del delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ value: 'c' });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ value: 'final' });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe('final');
  });
});
