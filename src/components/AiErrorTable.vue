<template>
  <v-data-table
    :headers="headers"
    :items="logs"
    class="elevation-1"
  >
    <template #item.timestamp="{ item }">
      {{ new Date(item.timestamp).toLocaleString() }}
    </template>
    <template #item.rawData="{ item }">
      <pre>{{ JSON.stringify(item.rawData, null, 2) }}</pre>
    </template>
  </v-data-table>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from '@/plugins/axios'

const logs = ref([])

const headers = [
  { title: '오류 유형', value: 'errorType' },
  { title: '메시지', value: 'message' },
  { title: '위치', value: 'location' },
  { title: '시간', value: 'timestamp' },
  { title: '전달된 원본 데이터', value: 'rawData' }
]

const fetchLogs = async () => {
  const res = await axios.get('/ai/error/all')
  logs.value = res.data
}

onMounted(fetchLogs)
</script>
