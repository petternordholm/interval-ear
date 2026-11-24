<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  variants: readonly { id: string; name: string }[];
  current: string;
}>();

const emit = defineEmits<{ change: [id: string] }>();

const dev = import.meta.env.DEV;

const name = computed(
  () => props.variants.find((item) => item.id === props.current)?.name ?? "",
);

function step(delta: number) {
  const index = props.variants.findIndex((item) => item.id === props.current);
  const count = props.variants.length;
  const next = props.variants[(index + delta + count) % count];
  if (next) emit("change", next.id);
}

function onKey(event: KeyboardEvent) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest("input, textarea, [contenteditable]")) return;
  if (target.closest("[data-slot='dialog-content'], [role='dialog']")) return;
  if (document.querySelector("[data-slot='dialog-backdrop']")) return;
  event.preventDefault();
  step(event.key === "ArrowRight" ? 1 : -1);
}

onMounted(() => {
  if (!dev) return;
  window.addEventListener("keydown", onKey);
});

onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <div
    v-if="dev"
    class="bp-switch"
    role="navigation"
    aria-label="Prototype variants"
  >
    <button type="button" aria-label="Previous variant" @click="step(-1)">
      ‹
    </button>
    <p aria-live="polite">{{ current }} ({{ name }})</p>
    <button type="button" aria-label="Next variant" @click="step(1)">›</button>
  </div>
</template>
