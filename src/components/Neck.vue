<script setup lang="ts">
import { Toggle } from "@ui-sdk/vue/toggle";
import { Toolbar, ToolbarButton } from "@ui-sdk/vue/toolbar";
import { computed, ref } from "vue";
import { noteName, octaveOf } from "../theory";
import {
  DIAGRAM_STRINGS,
  FRET_NUMBERS,
  canonical,
  fretPhrase,
  inlayCount,
  positionRole,
  sameSpot,
  spotAria,
  spotAt,
  spotLive,
  type FretPosition,
} from "../bass";

const props = defineProps<{
  root: number | null;
  target: number | null;
  choice: number | null;
  answerAt: FretPosition | null;
  touched: FretPosition | null;
  sounding: "root" | "other" | null;
  label: string;
}>();

const emit = defineEmits<{
  pick: [spot: FretPosition];
}>();

const showNotes = ref(true);

const laneStyle = {
  gridTemplateColumns: `repeat(${FRET_NUMBERS.length}, minmax(2.65rem, 1fr))`,
};

const board = computed(() => ({
  root: props.root,
  target: props.target,
  choice: props.choice,
  answerAt: props.answerAt,
}));

const strings = computed(() =>
  DIAGRAM_STRINGS.map((string) => ({
    ...string,
    frets: FRET_NUMBERS.map((fret) => {
      const spot = spotAt(string.id, fret);
      const mark = positionRole(spot, board.value);
      return {
        fret,
        spot,
        mark,
        live: spotLive(spot, props.sounding, props.root, props.target),
        touched: sameSpot(props.touched, spot),
        label: spotAria(spot, mark),
        name: noteName(spot.midi),
        octave: octaveOf(spot.midi),
      };
    }),
  })),
);

const caption = computed(() => {
  if (props.answerAt) return fretPhrase(props.answerAt);
  if (props.touched) return fretPhrase(props.touched);
  if (props.root !== null) {
    const spot = canonical(props.root);
    if (spot) return `Root · ${fretPhrase(spot)}`;
  }
  return "Tap a dot to choose the tone";
});
</script>

<template>
  <div class="neck-answer">
    <div class="notes-row">
      <Toggle
        v-model:pressed="showNotes"
        class="note-names"
        aria-label="Note names"
      >
        Note names
      </Toggle>
    </div>
    <div class="neck-scroll">
      <div class="neck" role="group" :aria-label="label">
        <div class="neck-row" aria-hidden="true">
          <span class="neck-gutter">fret</span>
          <div class="neck-lane" :style="laneStyle">
            <span v-for="fret in FRET_NUMBERS" :key="fret" class="neck-num">
              <span
                v-if="inlayCount(fret)"
                class="neck-inlay"
                :data-double="inlayCount(fret) === 2 || undefined"
              />
              {{ fret }}
            </span>
          </div>
        </div>
        <div
          v-for="string in strings"
          :key="string.id"
          class="neck-row"
          :style="{ '--gauge': `${string.gauge}px` }"
        >
          <span class="neck-gutter" aria-hidden="true">{{ string.id }}</span>
          <div class="neck-lane-wrap">
            <span class="neck-wire" aria-hidden="true" />
            <Toolbar
              class="neck-lane"
              :aria-label="`${string.id} string`"
              :style="laneStyle"
            >
              <ToolbarButton
                v-for="fret in string.frets"
                :key="fret.fret"
                class="neck-cell"
                :data-nut="fret.fret === 0 || undefined"
                :data-role="fret.mark"
                :data-live="fret.live || undefined"
                :data-touched="fret.touched || undefined"
                :aria-label="fret.label"
                @click="emit('pick', fret.spot)"
              >
                <span class="neck-spot">
                  <template v-if="showNotes">
                    <span class="neck-name">{{ fret.name }}</span>
                    <span class="neck-oct">{{ fret.octave }}</span>
                  </template>
                </span>
              </ToolbarButton>
            </Toolbar>
          </div>
        </div>
      </div>
    </div>
    <p class="neck-caption">{{ caption }}</p>
  </div>
</template>
