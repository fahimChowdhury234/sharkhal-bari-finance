<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  subtitle?: string
}>(), {
  label: 'Loading data...',
  subtitle: ''
})
</script>

<template>
  <div class="loading-state" role="status" aria-live="polite" aria-busy="true">
    <div class="loading-spinner" aria-hidden="true" />
    <div class="loading-copy">
      <strong>{{ label }}</strong>
      <p v-if="subtitle" class="muted">{{ subtitle }}</p>
    </div>
  </div>
</template>
