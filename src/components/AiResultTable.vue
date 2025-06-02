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
  { title: '감지 종류', value: 'type' },
  { title: '신뢰도(%)', value: 'confidence' },
  { title: '위치', value: 'location' },
  { title: '감지 시각', value: 'timestamp' }
]

onMounted(async () => {
  const res = await axios.get('/ai/result/all')
  logs.value = res.data
})
</script>
