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
  type StringId,
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

function role(stringId: StringId, fret: number) {
  return positionRole(spotAt(stringId, fret), board.value);
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
      <div
      class="neck"
      role="group"
      :aria-label="label"
    >
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
          v-for="string in DIAGRAM_STRINGS"
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
                v-for="fret in FRET_NUMBERS"
                :key="fret"
                class="neck-cell"
                :data-nut="fret === 0 || undefined"
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
                <span class="neck-spot">
                  <template v-if="showNotes">
                    <span class="neck-name">{{
                      noteName(spotAt(string.id, fret).midi)
                    }}</span>
                    <span class="neck-oct">{{
                      octaveOf(spotAt(string.id, fret).midi)
                    }}</span>
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
