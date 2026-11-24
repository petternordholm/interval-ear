<script setup lang="ts">
// Variant B (Tab): a staff of fret numbers. The tone is the line you write.
import { computed } from "vue";
import {
  DIAGRAM_STRINGS,
  FRET_NUMBERS,
  canonical,
  fretPhrase,
  positionRole,
  sameSpot,
  spotAria,
  spotAt,
  spotLive,
  type BassBoard,
  type StringId,
} from "./bass";

const props = defineProps<BassBoard>();
const emit = defineEmits<{ pick: [spot: ReturnType<typeof spotAt>] }>();

const laneStyle = {
  gridTemplateColumns: `1.6rem repeat(${FRET_NUMBERS.length}, minmax(1.45rem, 1fr))`,
};

const hero = computed(() => {
  if (props.answerAt) return fretPhrase(props.answerAt);
  if (props.touched) return fretPhrase(props.touched);
  if (props.root !== null) {
    const spot = canonical(props.root);
    if (spot) return `Root · ${fretPhrase(spot)}`;
  }
  return "Tap a fret on a string";
});

function glyph(stringId: StringId, fret: number): string {
  return positionRole(spotAt(stringId, fret), props) ? String(fret) : "–";
}
</script>

<template>
  <div class="bp-tab-wrap">
    <p class="bp-readout">{{ hero }}</p>
    <div class="bp-tab" role="group" :aria-label="label">
      <div class="bp-tab-row bp-tab-head" :style="laneStyle" aria-hidden="true">
        <span class="bp-tab-name" />
        <span v-for="fret in FRET_NUMBERS" :key="fret" class="bp-tab-num">{{
          fret
        }}</span>
      </div>
      <div
        v-for="string in DIAGRAM_STRINGS"
        :key="string.id"
        class="bp-tab-row"
        :style="laneStyle"
      >
        <span class="bp-tab-name" aria-hidden="true">{{ string.id }}</span>
        <button
          v-for="fret in FRET_NUMBERS"
          :key="fret"
          type="button"
          :data-role="positionRole(spotAt(string.id, fret), $props)"
          :data-live="
            spotLive(spotAt(string.id, fret), sounding, root, target) ||
            undefined
          "
          :data-touched="
            sameSpot(touched, spotAt(string.id, fret)) || undefined
          "
          :aria-label="
            spotAria(
              spotAt(string.id, fret),
              positionRole(spotAt(string.id, fret), $props),
            )
          "
          @click="emit('pick', spotAt(string.id, fret))"
        >
          {{ glyph(string.id, fret) }}
        </button>
      </div>
    </div>
    <p class="hint">
      The row is the string and the column is the fret. A dash is empty. Orange
      is the root, green is the note that played.
      <span class="swipe"
        >Scroll sideways if the staff runs off the screen.</span
      >
    </p>
  </div>
</template>
