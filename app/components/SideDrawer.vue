<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title: string
  description?: string
  busy?: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'close'): void
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

function close() {
  isOpen.value = false
  emit('close')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    close()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="isOpen" class="drawer-overlay" @click.self="close">
        <aside class="drawer panel">
          <header class="drawer-header">
            <div>
              <p class="drawer-kicker">Add / Edit</p>
              <h2>{{ title }}</h2>
              <p v-if="description" class="muted">{{ description }}</p>
            </div>

            <button class="btn ghost drawer-close" type="button" @click="close">
              Close
            </button>
          </header>

          <div class="drawer-body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="drawer-footer">
            <slot name="footer" />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
