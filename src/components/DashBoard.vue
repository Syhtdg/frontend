<template>
  <v-container fluid>
    <v-app-bar>
      <img src="@/assets/입체 로고.png" alt="Logo" class="logo" />
      <v-btn>계정 관리</v-btn>
      <v-btn>CCTV 관리</v-btn>
      <v-btn>사용자 관리</v-btn>
      <v-btn @click="$router.push('/log')">로그 관리</v-btn>
    </v-app-bar>

    <!-- 기상 정보 -->
    <div>
      <h3>기상정보</h3>
      <div class="weather-info-card">
        <p class="letter">온도:<span class="wether-info">20</span></p>
        <p class="letter">습도:<span class="wether-info">62%</span></p>
        <p class="letter">풍량:<span class="wether-info">200</span></p>
        <p class="letter">강수량:<span class="wether-info">210mm</span></p>
      </div>
    </div>

    <!-- 🔍 필터 -->
    <div class="filter-section">
      <v-select
        v-model="typeFilter"
        :items="['전체', '불', '연기']"
        label="종류 선택"
        dense
        outlined
        class="filter-item"
        color="gray"
      ></v-select>

      <v-menu
        v-model="dateMenu"
        transition="scale-transition"
        offset-y
        min-width="auto"
      >
        <template #activator="{ props }">
          <v-text-field
            v-model="formattedDate"
            v-bind="props"
            label="📅 날짜 선택"
            dense
            outlined
            class="filter-item"
            readonly
            clearable
            @click:clear="clearDate"
          />
        </template>
        <v-date-picker
          v-model="selectedDate"
          @update:modelValue="onDateSelected"
          locale="ko"
        ></v-date-picker>
      </v-menu>
    </div>

    <!-- 🔥 위험 정보 카드 -->
    <div>
      <h3>화재 위험 지역 정보</h3>
      <div class="local-info-card-scroll">
        <v-card
          class="pa-4 mb-2"
          v-for="log in filteredLogs"
          :key="log._id"
          :class="log.type === '불' ? 'fire-card' : 'smoke-card'"
        >
          <strong>위치:</strong> {{ log.location }}<br />
          <strong>종류:</strong> {{ log.type }}<br />
          <strong>신뢰도:</strong> {{ log.confidence }}%<br />
          <small class="text-grey">{{ formatKoreanDate(log.timestamp) }}</small>
        </v-card>
      </div>
    </div>

    <!-- 지도 -->
    <div>
      <h3>지도</h3>
      <div id="map" class="map" style="width: 560px; height: 768px; border-radius: 13px;"></div>
    </div>

    <!-- 📢 실시간 경고 다이얼로그 -->
    <v-dialog v-model="alertDialog" persistent max-width="500">
      <v-card class="alert-dialog-card pa-6 text-center">
        <v-card-title class="text-h5 font-weight-bold mb-2">
          {{ alertTitle }}
        </v-card-title>

        <v-card-text
          class="mt-3"
          style="white-space: pre-line; font-size: 18px; line-height: 1.6;"
        >
          {{ alertMessage }}
        </v-card-text>

        <v-card-actions class="justify-center mt-6">
          <v-btn
            color="red"
            variant="flat"
            class="confirm-button"
            @click="closeAlert"
          >
            확인
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/plugins/axios'
import io from 'socket.io-client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

// 다이얼로그 상태
const alertDialog = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')

// 🔊 재생 중인 사운드 저장 배열
const playingSounds = ref([])

// 필터 및 로그
const logs = ref([])
const typeFilter = ref('전체')
const selectedDate = ref(null)
const formattedDate = ref('')
const dateMenu = ref(false)

const socket = io('http://localhost:10111')

const fetchLogs = async () => {
  try {
    const res = await axios.get('/ai/result/all')
    logs.value = res.data
  } catch (e) {
    console.error('AI 로그 불러오기 실패:', e)
  }
}

const onDateSelected = (date) => {
  formattedDate.value = format(date, 'yyyy-MM-dd')
  dateMenu.value = false
}

const clearDate = () => {
  selectedDate.value = null
  formattedDate.value = ''
}

const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    const matchesType = typeFilter.value === '전체' || log.type === typeFilter.value
    const matchesDate =
      !selectedDate.value ||
      format(new Date(log.timestamp), 'yyyy-MM-dd') === format(selectedDate.value, 'yyyy-MM-dd')
    return matchesType && matchesDate
  })
})

const formatKoreanDate = (date) => {
  return format(new Date(date), 'yyyy년 M월 d일 (eee) HH:mm:ss', { locale: ko })
}

function closeAlert() {
  alertDialog.value = false
  playingSounds.value.forEach(sound => {
    sound.pause()
    sound.currentTime = 0
  })
  playingSounds.value = [] // 배열 초기화
}

onMounted(() => {
  fetchLogs()

  socket.on('aiResult', (data) => {
    logs.value.unshift(data)
    if (logs.value.length > 50) logs.value.pop()

    alertDialog.value = true

    let sound
    if (data.type === '불') {
      alertTitle.value = '🔥 화재 감지됨'
      sound = new Audio('/sounds/fire.mp3')
    } else {
      alertTitle.value = '💨 연기 감지됨'
      sound = new Audio('/sounds/smoke.mp3')
    }

    sound.volume = 1.0
    sound.play().catch(err => {
      console.warn('사운드 재생 실패:', err)
    })

    playingSounds.value.push(sound)

    alertMessage.value = `위치: ${data.location}\n신뢰도: ${data.confidence}%`
  })

  // 지도 로딩
  if (typeof kakao === 'undefined') {
    const script = document.createElement('script')
    script.src = "//dapi.kakao.com/v2/maps/sdk.js?appkey=7287e30fdbe7200a54db305e55034cce&autoload=false"
    script.onload = () => kakao.maps.load(initMap)
    document.head.appendChild(script)
  } else {
    initMap()
  }
})

function initMap() {
  const container = document.getElementById('map')
  const options = {
    center: new kakao.maps.LatLng(37.532600, 127.024612),
    level: 3
  }
  new kakao.maps.Map(container, options)
}
</script>


<style scoped>
html, body {
  margin: 0;
  padding: 0;
  height: 100vh;
}
.v-application {
  margin: 0 !important;
  padding: 0 !important;
}
.v-app-bar {
  background-color: #A30505 !important;
}
.logo {
  margin-left: 14px;
  width: auto;
  height: 35px;
}
.v-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  padding: 30px 40px;
  background-color: #FBFBFB;
  gap: 30px;
  overflow-y: auto;
}
.weather-info-card {
  width: 300px;
  padding: 20px;
  background-color: #FFFFFF;
  border-radius: 13px;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
}
.local-info-card-scroll {
  width: 300px;
  height: 600px;
  padding: 20px;
  background-color: #FFFFFF;
  border-radius: 13px;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  overflow-y: auto;
}
.local-info-card-scroll::-webkit-scrollbar {
  width: 6px;
}
.local-info-card-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}
.fire-card {
  background-color: #f33f3f !important;
  border-left: 6px solid rgb(0, 0, 0);
}
.smoke-card {
  background-color: #000000 !important;
  border-left: 6px solid black;
}
.map {
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
}
h3 {
  color: black;
}
.letter {
  color: black;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}
.wether-info {
  margin-left: 20px;
  color: cadetblue;
  font-size: 20px;
  font-weight: 300;
}
.filter-section {
  display: flex;
  gap: 16px;
  margin: 0 20px 20px 20px;
}
.filter-item {
  width: 200px;
  color: black;
}

.alert-dialog-card {
  background-color: #343a40;
  color: white;
  border: 2px solid rgba(255, 100, 100, 0.8);
  border-radius: 12px;
  box-shadow: 0 0 16px rgba(255, 100, 100, 0.4);
}
</style>
