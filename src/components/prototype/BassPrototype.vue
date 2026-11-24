<script setup lang="ts">
// PROTOTYPE — throwaway.
// Three variants of answering on a bass (string + fret) instead of the piano,
// on the main page, switchable via ?variant=A|B|C.
// A Neck: the whole fingerboard, note names on the frets.
// B Tab: a tab staff, fret numbers are the control.
// C One string: pick the string, then the fret.
import { computed, onMounted, onUnmounted, ref } from "vue";
import { noteLabel } from "../../theory";
import VariantA from "./VariantA.vue";
import VariantB from "./VariantB.vue";
import VariantC from "./VariantC.vue";
import PrototypeSwitcher from "./PrototypeSwitcher.vue";
import {
  fretPhrase,
  placesFor,
  type BassBoard,
  type FretPosition,
} from "./bass";
import "./prototype.css";

const props = defineProps<
  BassBoard & { phase: "ready" | "guess" | "revealed" }
>();

const emit = defineEmits<{ pick: [spot: FretPosition] }>();

const variants = [
  { id: "A", name: "Neck" },
  { id: "B", name: "Tab" },
  { id: "C", name: "One string" },
] as const;

type VariantId = (typeof variants)[number]["id"];

function readVariant(): VariantId {
  const value = new URLSearchParams(window.location.search).get("variant");
  if (value === "A" || value === "B" || value === "C") return value;
  return "A";
}

function readNotes(): boolean {
  return new URLSearchParams(window.location.search).get("notes") !== "off";
}

const variant = ref<VariantId>(readVariant());
const showNotes = ref(readNotes());

const variantName = computed(
  () => variants.find((item) => item.id === variant.value)?.name ?? "Neck",
);

const board = computed(() => ({
  root: props.root,
  target: props.target,
  choice: props.choice,
  answerAt: props.answerAt,
  touched: props.touched,
  sounding: props.sounding,
  label: props.label,
}));

const stateText = computed(() => {
  const sound = props.sounding ? ` · sounding ${props.sounding}` : "";
  const rootLine =
    props.root === null
      ? "root —"
      : `root ${noteLabel(props.root)} midi ${props.root} · ${placesFor(props.root)}`;
  const choiceLine = props.answerAt
    ? `choice ${fretPhrase(props.answerAt)} midi ${props.answerAt.midi}`
    : "choice —";
  const touchedLine = props.touched
    ? `touched ${fretPhrase(props.touched)}`
    : "touched —";
  const targetLine =
    props.target === null
      ? "target hidden"
      : `target ${noteLabel(props.target)} midi ${props.target} · ${placesFor(props.target)}`;
  const notes =
    variant.value === "A" ? ` · notes ${showNotes.value ? "on" : "off"}` : "";
  return [
    `${variant.value} ${variantName.value}${notes} · ${props.phase}${sound}`,
    rootLine,
    choiceLine,
    touchedLine,
    targetLine,
  ].join("\n");
});

function onVariant(id: string) {
  if (id !== "A" && id !== "B" && id !== "C") return;
  variant.value = id;
  const url = new URL(window.location.href);
  url.searchParams.set("variant", id);
  window.history.replaceState(null, "", url);
}

function onNotes(value: boolean) {
  showNotes.value = value;
  const url = new URL(window.location.href);
  if (value) url.searchParams.delete("notes");
  else url.searchParams.set("notes", "off");
  window.history.replaceState(null, "", url);
}

function onPop() {
  variant.value = readVariant();
  showNotes.value = readNotes();
}

onMounted(() => {
  onVariant(variant.value);
  window.addEventListener("popstate", onPop);
});

onUnmounted(() => window.removeEventListener("popstate", onPop));
</script>

<template>
  <div class="bp">
    <p class="bp-kicker">Prototype · string and fret</p>
    <VariantA
      v-if="variant === 'A'"
      v-bind="board"
      :show-notes="showNotes"
      @update:show-notes="onNotes"
      @pick="emit('pick', $event)"
    />
    <VariantB
      v-else-if="variant === 'B'"
      v-bind="board"
      @pick="emit('pick', $event)"
    />
    <VariantC v-else v-bind="board" @pick="emit('pick', $event)" />
    <p class="bp-state-label">Prototype state</p>
    <pre class="bp-state">{{ stateText }}</pre>
    <Teleport to="body">
      <PrototypeSwitcher
        :variants="variants"
        :current="variant"
        @change="onVariant"
      />
    </Teleport>
  </div>
</template>
