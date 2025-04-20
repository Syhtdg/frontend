<template>
  <v-data-table :headers="headers" :items="logs" class="elevation-1">
    <template #item.timestamp="{ item }">
      {{ new Date(item.timestamp).toLocaleString() }}
    </template>
  </v-data-table>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/plugins/axios'

const logs = ref([])

const headers = [
  { title: '사용자 ID', value: 'userId' },
  { title: '행동 유형', value: 'action' },
  { title: '세부내용', value: 'details' },
  { title: '기록 시각', value: 'timestamp' }
]

onMounted(async () => {
  const res = await axios.get('/log/all')
  logs.value = res.data
})
</script>
