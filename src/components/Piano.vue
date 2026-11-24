<script setup lang="ts">
import { Toolbar, ToolbarButton } from '@ui-sdk/vue/toolbar'
import { computed } from 'vue'
import { noteSpoken, pianoKeys } from '../theory'

const props = defineProps<{
  root: number | null
  target: number | null
  choice: number | null
  sounding: 'root' | 'other' | null
  label: string
}>()

const emit = defineEmits<{
  pick: [midi: number]
}>()

const keys = pianoKeys()

const soundingAttr = computed(() => props.sounding ?? undefined)

function outcome(midi: number): 'correct' | 'wrong' | undefined {
  if (props.choice === null || props.target === null) return undefined
  if (midi === props.target) return 'correct'
  if (midi === props.choice) return 'wrong'
  return undefined
}

function keyLabel(midi: number, name: string, octave: number): string {
  const spoken = noteSpoken(midi)
  if (props.root === midi && props.target !== midi) return `${spoken}, the root`
  if (outcome(midi) === 'correct') return `${spoken}, the note that played`
  if (outcome(midi) === 'wrong') return `${spoken}, your answer`
  return `${name.replace('♯', ' sharp')} ${octave}`
}
</script>

<template>
  <Toolbar class="piano" :aria-label="label" :data-sounding="soundingAttr">
    <ToolbarButton
      v-for="key in keys"
      :key="key.midi"
      :aria-label="keyLabel(key.midi, key.name, key.octave)"
      :data-accidental="key.black ? 'black' : 'white'"
      :data-root="root === key.midi || undefined"
      :data-outcome="outcome(key.midi)"
      :style="key.style"
      @click="emit('pick', key.midi)"
    >
      <span class="key-name">{{ key.name }}</span>
      <span class="key-octave">{{ key.octave }}</span>
    </ToolbarButton>
  </Toolbar>
</template>
