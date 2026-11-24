<script setup lang="ts">
import { Settings, X } from '@lucide/vue'
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@ui-sdk/vue/dialog'
import { Field, FieldDescription, FieldLabel } from '@ui-sdk/vue/field'
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from '@ui-sdk/vue/segmented-control'
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from '@ui-sdk/vue/slider'
import { Toggle, ToggleGroup } from '@ui-sdk/vue/toggle'
import { Button } from '@ui-sdk/vue/button'
import { computed } from 'vue'
import type { Settings as PracticeSettings } from '../storage'
import {
  INTERVALS,
  PRESETS,
  describeIntervals,
  presetFor,
  presetTitle,
  type PresetId,
} from '../theory'

const settings = defineModel<PracticeSettings>({ required: true })

defineEmits<{
  resetScore: []
}>()

const preset = computed({
  get: (): PresetId => presetFor(settings.value.intervals),
  set: (id: PresetId | null) => {
    if (!id || id === 'custom' || !(id in PRESETS)) return
    settings.value.intervals = [...PRESETS[id]]
  },
})

const intervals = computed({
  get: () => settings.value.intervals.map(String),
  set: (next: string[]) => {
    if (next.length === 0) return
    settings.value.intervals = next.map(Number).sort((left, right) => left - right)
  },
})

const gap = computed({
  get: () => settings.value.gap,
  set: (value: number) => {
    settings.value.gap = value
  },
})

const volume = computed({
  get: () => settings.value.volume,
  set: (value: number) => {
    settings.value.volume = value
  },
})

const presets: { id: PresetId; label: string }[] = [
  { id: 'fifths', label: '4ths & 5ths' },
  { id: 'easy', label: 'Easy' },
  { id: 'steps', label: 'Steps' },
  { id: 'wide', label: 'Wide' },
  { id: 'all', label: 'All' },
  { id: 'custom', label: 'Custom' },
]

function keepOne(next: string[], details: { cancel: () => void }) {
  if (next.length === 0) details.cancel()
}

const gapLabel = (seconds: number) => `${seconds.toFixed(1)} s`
</script>

<template>
  <Dialog>
    <DialogTrigger>
      <Settings aria-hidden="true" />
      Settings
    </DialogTrigger>
    <DialogBackdrop />
    <DialogContent>
      <div class="dialog-head">
        <div>
          <DialogTitle>What to practice</DialogTitle>
          <DialogDescription>
            {{ presetTitle(preset) }}. Changes apply to the next note.
          </DialogDescription>
        </div>
        <DialogClose aria-label="Close">
          <X aria-hidden="true" />
        </DialogClose>
      </div>

      <Field>
        <FieldLabel>Drill</FieldLabel>
        <div class="scroller">
          <SegmentedControl v-model:value="preset" aria-label="Drill">
            <SegmentedControlIndicator />
            <SegmentedControlItem v-for="item in presets" :key="item.id" :value="item.id">
              {{ item.label }}
            </SegmentedControlItem>
          </SegmentedControl>
        </div>
        <FieldDescription>{{ describeIntervals(settings.intervals) }}</FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Intervals</FieldLabel>
        <ToggleGroup
          v-model:value="intervals"
          class="intervals"
          multiple
          aria-label="Intervals in the drill"
          @value-change="keepOne"
        >
          <Toggle
            v-for="interval in INTERVALS"
            :key="interval.semitones"
            :value="String(interval.semitones)"
            :aria-label="`${interval.short}, ${interval.name}`"
          >
            {{ interval.short }}
          </Toggle>
        </ToggleGroup>
        <FieldDescription>At least one interval stays on. A fifth above C is G.</FieldDescription>
      </Field>

      <Field>
        <Slider v-model:value="gap" :min="0.2" :max="1.5" :step="0.1" :format="gapLabel">
          <div class="row">
            <FieldLabel>Gap between the notes</FieldLabel>
            <SliderValue />
          </div>
          <SliderControl>
            <SliderTrack>
              <SliderIndicator />
              <SliderThumb />
            </SliderTrack>
          </SliderControl>
        </Slider>
      </Field>

      <Field>
        <Slider
          v-model:value="volume"
          :min="0"
          :max="1"
          :step="0.05"
          :format="{ style: 'percent' }"
        >
          <div class="row">
            <FieldLabel>Volume</FieldLabel>
            <SliderValue />
          </div>
          <SliderControl>
            <SliderTrack>
              <SliderIndicator />
              <SliderThumb />
            </SliderTrack>
          </SliderControl>
        </Slider>
      </Field>

      <div class="dialog-actions">
        <Button @click="$emit('resetScore')">Clear score</Button>
        <DialogClose data-variant="solid">Done</DialogClose>
      </div>
    </DialogContent>
  </Dialog>
</template>
