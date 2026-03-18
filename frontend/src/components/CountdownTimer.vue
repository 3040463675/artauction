<template>
  <span class="countdown-timer">{{ formattedTime }}</span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  endTime: number
}

const props = defineProps<Props>()
const emit = defineEmits(['end'])

const now = ref(Date.now())
let timer: number | null = null

const remaining = computed(() => {
  return Math.max(0, props.endTime - now.value)
})

const formattedTime = computed(() => {
  const ms = remaining.value
  if (ms <= 0) return '已结束'

  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天 ${hours % 24}时 ${minutes % 60}分`
  }
  if (hours > 0) {
    return `${hours}时 ${minutes % 60}分 ${seconds % 60}秒`
  }
  if (minutes > 0) {
    return `${minutes}分 ${seconds % 60}秒`
  }
  return `${seconds}秒`
})

const tick = () => {
  now.value = Date.now()
  if (remaining.value <= 0) {
    emit('end')
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

onMounted(() => {
  timer = window.setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style lang="scss" scoped>
.countdown-timer {
  font-family: monospace;
}
</style>
