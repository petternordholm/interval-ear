const PARTIALS: { ratio: number; type: OscillatorType; gain: number }[] = [
  { ratio: 1, type: 'triangle', gain: 0.62 },
  { ratio: 2, type: 'sine', gain: 0.22 },
  { ratio: 3, type: 'sine', gain: 0.12 },
  { ratio: 4, type: 'sine', gain: 0.07 },
  { ratio: 6, type: 'sine', gain: 0.04 },
]

let context: AudioContext | null = null
let oscillators: OscillatorNode[] = []

export function canPlay(): boolean {
  return typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined'
}

export function audioContext(): AudioContext {
  if (!context) context = new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

export function stopNotes(): void {
  const now = context?.currentTime ?? 0
  for (const oscillator of oscillators) {
    try {
      oscillator.stop(now)
    } catch {
      // The note already finished.
    }
  }
  oscillators = []
}

export function scheduleNote(midi: number, when: number, duration: number, volume: number): void {
  const ctx = audioContext()
  const frequency = 440 * 2 ** ((midi - 69) / 12)
  const master = ctx.createGain()
  const peak = Math.max(0.0001, volume * 0.22)
  master.gain.setValueAtTime(0.0001, when)
  master.gain.exponentialRampToValueAtTime(peak, when + 0.015)
  master.gain.exponentialRampToValueAtTime(peak * 0.42, when + Math.min(0.16, duration * 0.25))
  master.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  master.connect(ctx.destination)

  for (const partial of PARTIALS) {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = partial.type
    oscillator.frequency.setValueAtTime(frequency * partial.ratio * 1.008, when)
    oscillator.frequency.exponentialRampToValueAtTime(frequency * partial.ratio, when + 0.04)
    gain.gain.value = partial.gain
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(when)
    oscillator.stop(when + duration + 0.02)
    oscillators.push(oscillator)
  }
}
