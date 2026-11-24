<script setup lang="ts">
// Variant C (One string): the string is the first choice, the fret the second.
// Low E on top, the neck as it sits when you play.
import { computed, ref, watch } from "vue";
import { noteLabel } from "../../theory";
import {
  FRET_NUMBERS,
  STRINGS,
  canonical,
  fretPhrase,
  positionRole,
  positionsFor,
  sameSpot,
  spotAria,
  spotAt,
  spotLive,
  type BassBoard,
  type StringId,
} from "./bass";

const props = defineProps<BassBoard>();
const emit = defineEmits<{ pick: [spot: ReturnType<typeof spotAt>] }>();

const armed = ref<StringId>("A");

watch(
  () => props.root,
  (root) => {
    if (root === null) return;
    const spot = canonical(root);
    if (spot) armed.value = spot.stringId;
  },
  { immediate: true },
);

const readout = computed(() => {
  if (props.answerAt?.stringId === armed.value)
    return fretPhrase(props.answerAt);
  if (props.touched?.stringId === armed.value) return fretPhrase(props.touched);
  if (props.target !== null) {
    const answer = positionsFor(props.target).find(
      (spot) => spot.stringId === armed.value,
    );
    if (answer) return fretPhrase(answer);
  }
  if (props.root !== null) {
    const root = positionsFor(props.root).find(
      (spot) => spot.stringId === armed.value,
    );
    if (root) return `Root · ${fretPhrase(root)}`;
  }
  return `${armed.value} string · choose a fret`;
});

function tag(stringId: StringId): string {
  const parts: string[] = [];
  if (
    props.root !== null &&
    positionsFor(props.root).some((spot) => spot.stringId === stringId)
  ) {
    parts.push("root");
  }
  if (
    props.target !== null &&
    positionsFor(props.target).some((spot) => spot.stringId === stringId)
  ) {
    parts.push("answer");
  }
  return parts.join(" · ");
}

function stringAria(stringId: StringId): string {
  const string = STRINGS.find((item) => item.id === stringId)!;
  const mark = tag(stringId);
  const base = `${string.id} string, open ${noteLabel(string.open)}`;
  return mark ? `${base}, ${mark}` : base;
}
</script>

<template>
  <div class="bp-one">
    <p class="bp-readout bp-readout-span">{{ readout }}</p>
    <div class="bp-strings" role="group" aria-label="Strings">
      <button
        v-for="string in STRINGS"
        :key="string.id"
        type="button"
        class="bp-string"
        :data-armed="armed === string.id || undefined"
        :data-root="tag(string.id).includes('root') || undefined"
        :data-answer="tag(string.id).includes('answer') || undefined"
        :aria-pressed="armed === string.id"
        :aria-label="stringAria(string.id)"
        @click="armed = string.id"
      >
        <span class="bp-gauge" :style="{ height: `${string.gauge}px` }" />
        <span class="bp-string-name">{{ string.id }}</span>
        <span class="bp-string-open">{{ noteLabel(string.open) }}</span>
        <span v-if="tag(string.id)" class="bp-tag">{{ tag(string.id) }}</span>
      </button>
    </div>
    <div class="bp-ruler" role="group" :aria-label="label">
      <button
        v-for="fret in FRET_NUMBERS"
        :key="fret"
        type="button"
        class="bp-fret"
        :data-nut="fret === 0 || undefined"
        :data-role="positionRole(spotAt(armed, fret), props)"
        :data-live="
          spotLive(spotAt(armed, fret), sounding, root, target) || undefined
        "
        :data-touched="sameSpot(touched, spotAt(armed, fret)) || undefined"
        :aria-label="
          spotAria(
            spotAt(armed, fret),
            positionRole(spotAt(armed, fret), props),
          )
        "
        @click="emit('pick', spotAt(armed, fret))"
      >
        <span class="bp-fret-no">{{ fret }}</span>
        <span class="bp-fret-pitch">{{
          noteLabel(spotAt(armed, fret).midi)
        }}</span>
      </button>
    </div>
    <p class="hint bp-readout-span">
      Low E is on top, the way the neck sits when you play. Choose a string,
      then a fret. The root's string starts selected.
    </p>
  </div>
</template>
