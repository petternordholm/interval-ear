<script setup lang="ts">
import { AudioLines, Play } from "@lucide/vue";
import { Button } from "@ui-sdk/vue/button";
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "@ui-sdk/vue/segmented-control";
import { Toolbar, ToolbarButton, ToolbarSeparator } from "@ui-sdk/vue/toolbar";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { audioContext, canPlay, scheduleNote, stopNotes } from "./audio";
import Piano from "./components/Piano.vue";
import SettingsDialog from "./components/SettingsDialog.vue";
import {
  emptyStats,
  loadSettings,
  loadStats,
  saveSettings,
  saveStats,
  type Settings,
  type Stats,
} from "./storage";
import {
  createQuestion,
  noteLabel,
  noteName,
  noteSpoken,
  presetFor,
  presetTitle,
  relation,
  resultText,
  type DirectionChoice,
  type Question,
} from "./theory";

const settings = ref<Settings>(loadSettings());
const stats = ref<Stats>(loadStats());
const question = ref<Question | null>(null);
const choice = ref<number | null>(null);
const phase = ref<"ready" | "guess" | "revealed">("ready");
const sounding = ref<"root" | "other" | null>(null);
const status = ref("");
const audioError = ref("");
const timers: number[] = [];

watch(settings, (value) => saveSettings(value), { deep: true });
watch(stats, (value) => saveStats(value), { deep: true });

const direction = computed({
  get: () => settings.value.direction,
  set: (value: DirectionChoice | null) => {
    if (value) settings.value.direction = value;
  },
});

const drill = computed(() => presetTitle(presetFor(settings.value.intervals)));

const prompt = computed(() => {
  if (!question.value) return "a fifth above · example";
  const label = noteLabel(question.value.root);
  if (settings.value.direction === "either") return `Above or below ${label}`;
  return question.value.direction === "up"
    ? `Above ${label}`
    : `Below ${label}`;
});

const rootPitch = computed(() =>
  question.value ? noteName(question.value.root) : "C",
);
const rootMeta = computed(() =>
  question.value ? noteLabel(question.value.root) : "C4 · example",
);
const otherPitch = computed(() => {
  if (!question.value || phase.value !== "revealed")
    return question.value ? "?" : "G";
  return noteName(question.value.target);
});
const otherMeta = computed(() => {
  if (!question.value) return "a fifth above · example";
  if (phase.value !== "revealed") return prompt.value;
  return relation(question.value);
});

const verdict = computed(() => {
  if (!question.value || choice.value === null || phase.value !== "revealed")
    return null;
  return resultText(question.value, choice.value);
});

const scoreLine = computed(() => {
  if (stats.value.heard === 0) return "No notes yet";
  const percent = Math.round((stats.value.correct / stats.value.heard) * 100);
  return `${stats.value.streak} streak · ${stats.value.correct}/${stats.value.heard} · ${percent}%`;
});

const pianoLabel = computed(() => {
  if (!question.value)
    return "Answer keyboard. Play the first note before choosing a key.";
  if (phase.value === "revealed")
    return "Answer keyboard. The correct key is marked. Click a key to hear it.";
  return "Answer keyboard. Choose the note you heard.";
});

function clearTimers() {
  while (timers.length > 0) {
    const id = timers.pop();
    if (id !== undefined) window.clearTimeout(id);
  }
}

function play(kind: "root" | "target" | "both") {
  const current = question.value;
  if (!current) return;
  if (!canPlay()) {
    audioError.value = "This browser cannot play sound.";
    return;
  }
  stopNotes();
  clearTimers();
  const ctx = audioContext();
  const start = ctx.currentTime + 0.05;
  const duration = 0.95;
  const gap = settings.value.gap;
  const volume = settings.value.volume;
  const named = phase.value === "revealed";

  if (kind === "root" || kind === "both")
    scheduleNote(current.root, start, duration, volume);
  if (kind === "target") scheduleNote(current.target, start, duration, volume);
  if (kind === "both")
    scheduleNote(current.target, start + duration + gap, duration, volume);

  sounding.value = kind === "target" ? "other" : "root";
  if (kind === "both") {
    timers.push(
      window.setTimeout(
        () => {
          sounding.value = "other";
        },
        (duration + gap) * 1000,
      ),
    );
  }
  timers.push(
    window.setTimeout(
      () => {
        sounding.value = null;
      },
      ((kind === "both" ? duration + gap + duration : duration) + 0.05) * 1000,
    ),
  );

  if (kind === "root")
    status.value = `Playing the root, ${noteSpoken(current.root)}`;
  else if (kind === "target") {
    status.value = named
      ? `Playing ${noteSpoken(current.target)}`
      : "Playing the other note";
  } else {
    status.value = named
      ? `Playing ${noteSpoken(current.root)}, then ${noteSpoken(current.target)}`
      : `Playing the root, ${noteSpoken(current.root)}, then the other note`;
  }
}

function hearKey(midi: number) {
  if (!canPlay()) {
    audioError.value = "This browser cannot play sound.";
    return;
  }
  stopNotes();
  clearTimers();
  sounding.value = null;
  scheduleNote(
    midi,
    audioContext().currentTime + 0.04,
    0.8,
    settings.value.volume,
  );
  status.value = `Playing ${noteSpoken(midi)}`;
}

function begin() {
  const next = createQuestion(
    settings.value.intervals,
    settings.value.direction,
  );
  if (!next) {
    status.value = "Turn on at least one interval in settings.";
    return;
  }
  question.value = next;
  choice.value = null;
  phase.value = "guess";
  play("both");
}

function nextRound() {
  const next = createQuestion(
    settings.value.intervals,
    settings.value.direction,
    Math.random,
    question.value,
  );
  if (!next) {
    status.value = "Turn on at least one interval in settings.";
    return;
  }
  question.value = next;
  choice.value = null;
  phase.value = "guess";
  play("both");
}

function onPick(midi: number) {
  const current = question.value;
  if (!current) return;
  if (phase.value === "revealed") {
    hearKey(midi);
    return;
  }
  if (phase.value !== "guess") return;

  choice.value = midi;
  phase.value = "revealed";
  const correct = midi === current.target;
  stats.value = {
    heard: stats.value.heard + 1,
    correct: stats.value.correct + (correct ? 1 : 0),
    streak: correct ? stats.value.streak + 1 : 0,
    best: correct
      ? Math.max(stats.value.best, stats.value.streak + 1)
      : stats.value.best,
  };
  timers.push(window.setTimeout(() => play("both"), 280));
}

function resetScore() {
  stats.value = emptyStats();
}

function onKeydown(event: KeyboardEvent) {
  if (event.code !== "Space" || event.repeat) return;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (
    target.closest('button, input, textarea, [role="dialog"], [role="slider"]')
  )
    return;
  if (!question.value) return;
  event.preventDefault();
  play("both");
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  clearTimers();
  stopNotes();
});
</script>

<template>
  <main class="ear">
    <header class="top">
      <div>
        <p class="eyebrow">Ear training</p>
        <h1>Interval ear</h1>
        <p class="lede">The root is named. You name the other note.</p>
      </div>
      <p class="scoreline">
        {{ scoreLine }}<span v-if="stats.best"> · best {{ stats.best }}</span>
      </p>
    </header>

    <div class="controls">
      <SegmentedControl v-model:value="direction" aria-label="Direction">
        <SegmentedControlIndicator />
        <SegmentedControlItem value="up">Up</SegmentedControlItem>
        <SegmentedControlItem value="down">Down</SegmentedControlItem>
        <SegmentedControlItem value="either">Either</SegmentedControlItem>
      </SegmentedControl>
      <p class="drill">{{ drill }}</p>
      <SettingsDialog v-model="settings" @reset-score="resetScore" />
    </div>

    <section class="card">
      <p v-if="!question" class="intro">
        You see the root, for example C. A second note then plays on its own.
        Find it on the keyboard. A fifth above C is G.
      </p>

      <div class="score">
        <div class="pitch-card" :data-live="sounding === 'root' || undefined">
          <p class="kicker">Root</p>
          <p class="pitch">{{ rootPitch }}</p>
          <p class="pitch-meta">{{ rootMeta }}</p>
        </div>
        <div class="pitch-card" :data-live="sounding === 'other' || undefined">
          <p class="kicker">Other note</p>
          <p class="pitch">{{ otherPitch }}</p>
          <p class="pitch-meta">{{ otherMeta }}</p>
        </div>
      </div>

      <p v-if="audioError" class="alert" role="alert">{{ audioError }}</p>
      <p class="status" aria-live="polite">{{ status }}</p>

      <div v-if="question" class="transport-wrap">
        <Toolbar class="transport" aria-label="Playback">
          <ToolbarButton @click="play('root')">
            <Play aria-hidden="true" />
            Root
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton @click="play('both')">
            <AudioLines aria-hidden="true" />
            Both
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton @click="play('target')">
            <Play aria-hidden="true" />
            Other
          </ToolbarButton>
        </Toolbar>
      </div>

      <div v-else class="ready-actions">
        <Button class="start" data-variant="solid" @click="begin"
          >Play the first note</Button
        >
      </div>

      <div class="keyboard-scroll">
        <Piano
          :root="question?.root ?? null"
          :target="phase === 'revealed' ? (question?.target ?? null) : null"
          :choice="choice"
          :sounding="sounding"
          :label="pianoLabel"
          @pick="onPick"
        />
      </div>
      <p class="hint">
        The orange bar is the root. Space replays both notes.
        <span class="swipe">Swipe the keyboard if it runs off the screen.</span>
      </p>

      <div v-if="verdict" class="verdict" :data-correct="verdict.correct">
        <p>{{ verdict.text }}</p>
        <Button data-variant="solid" @click="nextRound">Next note</Button>
      </div>
    </section>
  </main>
</template>
