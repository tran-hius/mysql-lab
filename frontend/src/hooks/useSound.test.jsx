import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSound } from './useSound.js'

class FakeAudioContext {
  constructor() {
    this.currentTime = 0
    this.destination = {}
  }
  createOscillator() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      type: 'sine',
    }
  }
  createGain() {
    return {
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    }
  }
  resume() {
    return Promise.resolve()
  }
  close() {
    return Promise.resolve()
  }
}

beforeEach(() => {
  localStorage.clear()
  window.AudioContext = FakeAudioContext
})

describe('useSound', () => {
  it('không ném lỗi khi phát âm thanh và bật mặc định', () => {
    const { result } = renderHook(() => useSound())
    expect(result.current.enabled).toBe(true)
    expect(() => act(() => result.current.play('success'))).not.toThrow()
  })

  it('tắt tiếng và ghi nhớ vào localStorage', () => {
    const { result } = renderHook(() => useSound())
    act(() => result.current.toggle())
    expect(result.current.enabled).toBe(false)
    expect(localStorage.getItem('mysql-lab:sound')).toBe('off')
  })

  it('đọc lại trạng thái đã tắt', () => {
    localStorage.setItem('mysql-lab:sound', 'off')
    const { result } = renderHook(() => useSound())
    expect(result.current.enabled).toBe(false)
  })

  it('không ném lỗi khi trình duyệt chặn AudioContext', () => {
    window.AudioContext = class {
      constructor() {
        throw new Error('AudioContext bị chặn')
      }
    }

    const { result } = renderHook(() => useSound())
    expect(() => act(() => result.current.play('select'))).not.toThrow()
  })
})
