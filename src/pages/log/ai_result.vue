<template>
  <v-container class="pa-6">
    <h2>AI 산불 감지 로그</h2>
    <v-data-table
      :headers="headers"
      :items="logs"
      class="elevation-1"
    >
      <template #item.timestamp="{ item }">
        {{ new Date(item.timestamp).toLocaleString() }}
      </template>
    </v-data-table>
  </v-container>
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

const fetchLogs = async () => {
  const res = await axios.get('/ai/result/all')
  logs.value = res.data
}

onMounted(() => {
  fetchLogs()
})
</script>
