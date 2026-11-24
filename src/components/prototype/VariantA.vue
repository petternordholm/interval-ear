<script setup lang="ts">
// Variant A (Neck): the fingerboard is the control. G on top.
import { noteName, octaveOf } from "../../theory";
import { computed } from "vue";
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
  type BassBoard,
  type StringId,
} from "./bass";

const props = defineProps<BassBoard & { showNotes: boolean }>();
const emit = defineEmits<{
  pick: [spot: ReturnType<typeof spotAt>];
  "update:showNotes": [value: boolean];
}>();

const laneStyle = {
  gridTemplateColumns: `repeat(${FRET_NUMBERS.length}, minmax(2.65rem, 1fr))`,
};

function role(stringId: StringId, fret: number) {
  return positionRole(spotAt(stringId, fret), props);
}

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
  <div>
    <div class="bp-notes-row">
      <button
        type="button"
        class="bp-notes"
        :aria-pressed="showNotes"
        @click="emit('update:showNotes', !showNotes)"
      >
        {{ showNotes ? "Notes on" : "Notes off" }}
      </button>
    </div>
    <div
      class="bp-neck"
      role="group"
      :aria-label="label"
      :data-notes="showNotes ? 'on' : 'off'"
    >
      <div class="bp-row" aria-hidden="true">
        <span class="bp-gutter">fret</span>
        <div class="bp-lane" :style="laneStyle">
          <span v-for="fret in FRET_NUMBERS" :key="fret" class="bp-num">
            <span
              v-if="inlayCount(fret)"
              class="bp-inlay"
              :data-double="inlayCount(fret) === 2 || undefined"
            />
            {{ fret }}
          </span>
        </div>
      </div>
      <div
        v-for="string in DIAGRAM_STRINGS"
        :key="string.id"
        class="bp-row"
        :style="{ '--gauge': `${string.gauge}px` }"
      >
        <span class="bp-gutter" aria-hidden="true">{{ string.id }}</span>
        <div class="bp-lane" :style="laneStyle">
          <span class="bp-wire" aria-hidden="true" />
          <span
            v-for="fret in FRET_NUMBERS"
            :key="fret"
            class="bp-cell"
            :data-nut="fret === 0 || undefined"
          >
            <button
              type="button"
              class="bp-spot"
              :data-role="role(string.id, fret)"
              :data-live="
                spotLive(spotAt(string.id, fret), sounding, root, target) ||
                undefined
              "
              :data-touched="
                sameSpot(touched, spotAt(string.id, fret)) || undefined
              "
              :aria-label="
                spotAria(spotAt(string.id, fret), role(string.id, fret))
              "
              @click="emit('pick', spotAt(string.id, fret))"
            >
              <template v-if="showNotes">
                <span class="bp-name">{{
                  noteName(spotAt(string.id, fret).midi)
                }}</span>
                <span class="bp-oct">{{
                  octaveOf(spotAt(string.id, fret).midi)
                }}</span>
              </template>
            </button>
          </span>
        </div>
      </div>
    </div>
    <p class="bp-caption">{{ caption }}</p>
    <p class="hint">
      G is the top string. 0 is open. Orange is the root. The same tone sits on
      more than one string.
      <span class="swipe"
        >Scroll sideways if the neck runs off the screen.</span
      >
    </p>
  </div>
</template>
