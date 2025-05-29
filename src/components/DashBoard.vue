<template>
  <v-container fluid class="dashboard-container">
    <v-app-bar>
      <img src="@/assets/입체 로고.png" alt="Logo" class="logo" />
      <v-btn>계정 관리</v-btn>
      <v-btn @click="$router.push('/cctvManage')">CCTV 관리</v-btn>
      <v-btn @click="$router.push('/log')">로그 관리</v-btn>
      <v-spacer />
      <v-btn @click="$router.push('/login')">로그아웃</v-btn>
    </v-app-bar>

    <div class="dashboard-content">
      <div class="left-column">
        <div>
          <h3>기상 정보</h3>
          <div class="weather-info-card">
            <p class="letter">
              온도:<span class="weather-info">{{ temp }}°C</span>
            </p>
            <p class="letter">
              습도:<span class="weather-info">{{ humidity }}%</span>
            </p>
            <p class="letter">
              풍향:<span class="weather-info">{{ windDirection }}</span>
            </p>
            <p class="letter">
              풍속:<span class="weather-info">{{ windSpeed }} m/s</span>
            </p>
            <p class="letter">
              강수량:<span class="weather-info">{{ precipitation }} mm</span>
            </p>
          </div>
        </div>

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
              <small class="text-grey">
                {{ formatKoreanDate(log.timestamp) }}
              </small>
            </v-card>
          </div>
        </div>
      </div>

      <div class="center-column">
        <div>
          <h3>CCTV</h3>
          <div class="cctv-view">
            <div class="media-container">
              <span v-if="cctvLoading">로딩 중…</span>
              <span v-else-if="cctvError" class="error">{{ cctvError }}</span>

              <template v-else-if="cctv">
                <h4 style="color: black;">{{ cctv.cctvname }}</h4>

                <video
                  v-if="cctv && cctv.cctvformat === 'HLS'"
                  ref="videoRef"
                  controls autoplay muted
                  class="media"
                >
                  <source
                    :src="streamUrl"
                    type="application/vnd.apple.mpegurl"
                  />
                  이 브라우저는 동영상을 지원하지 않습니다.
                </video>

                <video
                  v-else-if="cctv && cctv.cctvformat !== 'HLS'"
                  :src="streamUrl"
                  controls autoplay muted
                  class="media"
                >
                  이 브라우저는 동영상을 지원하지 않습니다.
                </video>
              </template>

              <span v-else class="placeholder">위치를 선택해주세요.</span>
            </div>
          </div>
        </div>

        <div>
          <h3>지도</h3>
          <keep-alive>
            <div id="map" class="map">
              <MapComponent @select-marker="onSelectMarker" />
            </div>
          </keep-alive>
        </div>
      </div>

      <div class="right-column">
        <h3>필터</h3>
        <div class="filter-section">
          <v-select
            v-model="typeFilter"
            :items="['전체', '불', '연기']"
            label="종류 선택"
            dense outlined
            class="filter-item"
            color="gray"
          />
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
                dense outlined
                class="filter-item"
                readonly clearable
                @click:clear="clearDate"
              />
            </template>
            <v-date-picker
              v-model="selectedDate"
              @update:model-value="onDateSelected"
              locale="ko"
            />
          </v-menu>
        </div>
      </div>
    </div>

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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import axios from '@/plugins/axios'
import io from 'socket.io-client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getWeather } from '@/services/weatherService'
import MapComponent from './MapComponent.vue'

import { fetchNearestCctv } from '@/services/cctv'
import Hls from 'hls.js'

// CCTV 상태 변수 정의
const cctv = ref(null)
const cctvLoading = ref(false)
const cctvError = ref('')
const videoRef = ref(null)
const playerURL = (url) =>
  `/player.html?src=${encodeURIComponent(url)}`

// 스트림 URL computed
const streamUrl = computed(() => {
  if (!cctv.value) return ''
  const u = new URL(cctv.value.cctvurl)
  return `/cctv-stream${u.pathname}${u.search}`
})

const isVideo = url => {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.includes('.m3u8') || lower.includes('.mp4')
}

// HLS 초기화 로직
watch(cctv, async (newVal) => {
  if (!newVal) return
  if (newVal.cctvformat === 'HLS') {
    await nextTick()
    const video = videoRef.value
    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(newVal.cctvurl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}))
    } else {
      video.src = newVal.cctvurl
      video.play().catch(() => {})
    }
  }
})

const alertDialog = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')
const playingSounds = ref([])
const logs = ref([])
const typeFilter = ref('전체')
const selectedDate = ref(null)
const formattedDate = ref('')
const dateMenu = ref(false)
const temp = ref(null)
const humidity = ref(null)
const windSpeed = ref(null)
const windDirection = ref(null)
const precipitation = ref(null)

// 소켓 연결
const socket = io('http://localhost:10111')

// CCTV 호출 핸들러
async function onSelectMarker({ lat, lng }) {
  cctvLoading.value = true
  cctvError.value = ''
  cctv.value = null
  try {
    const result = await fetchNearestCctv(lat, lng)
    console.log('CCTV API 응답:', result)
    console.log('cctvurl:', result.cctvurl)
    cctv.value = result
  } catch (err) {
    console.error(err)
    cctvError.value = err.message || 'CCTV 호출 실패'
  } finally {
    cctvLoading.value = false
  }
}

// AI 로그 조회
const fetchLogs = async () => {
  try {
    const res = await axios.get('/ai/result/all')
    logs.value = res.data
  } catch (e) {
    console.error('AI 로그 불러오기 실패:', e)
  }
}

// 날짜 선택 콜백
const onDateSelected = (date) => {
  formattedDate.value = format(date, 'yyyy-MM-dd')
  dateMenu.value = false
}

// 날짜 초기화
const clearDate = () => {
  selectedDate.value = null
  formattedDate.value = ''
}

// 필터링된 로그
const filteredLogs = computed(() =>
  logs.value.filter((log) => {
    const matchesType = typeFilter.value === '전체' || log.type === typeFilter.value
    const matchesDate =
      !selectedDate.value ||
      format(new Date(log.timestamp), 'yyyy-MM-dd') === format(selectedDate.value, 'yyyy-MM-dd')
    return matchesType && matchesDate
  })
)

// 한국어형식 날짜 포매팅
const formatKoreanDate = (date) =>
  format(new Date(date), 'yyyy년 M월 d일 (eee) HH:mm:ss', { locale: ko })

// 알림 닫기
function closeAlert() {
  alertDialog.value = false
  playingSounds.value.forEach((sound) => {
    sound.pause()
    sound.currentTime = 0
  })
  playingSounds.value = []
}

// 웹소켓 및 초기화 로직
onMounted(() => {
  fetchLogs()
  socket.on('log', (data) => {
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
    sound.play().catch((err) => {
      console.warn('사운드 재생 실패:', err)
    })

    playingSounds.value.push(sound)
    alertMessage.value = `위치: ${data.location}\n신뢰도: ${data.confidence}%`
  })
})

// 풍향 계산 함수
const getWindDirection = (deg) => {
  if (deg >= 0 && deg < 45) return '북'
  if (deg < 90) return '북동'
  if (deg < 135) return '동'
  if (deg < 180) return '남동'
  if (deg < 225) return '남'
  if (deg < 270) return '남서'
  if (deg < 315) return '서'
  return '북서'
}

// 기상 정보 조회
onMounted(async () => {
  try {
    const data = await getWeather(37.5326, 127.024612)
    temp.value = data.temp
    humidity.value = data.humidity
    windSpeed.value = data.windSpeed
    windDirection.value = getWindDirection(data.windDeg)
    precipitation.value = data.precipitation
  } catch (err) {
    console.error(err)
  }
})
</script>

<style scoped>
html,
body {
  margin: 0;
  padding: 0;
  height: 100vh;
}

h3 {
  color: #333;
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

.dashboard-container {
  display: flex;
  flex-direction: column;
  padding: 30px 40px;
  background-color: #FBFBFB;
  min-height: 100vh;
}

.dashboard-content {
  display: flex;
  flex-direction: row;
  gap: 24px;
  margin-top: 24px;
  width: 100%;
  justify-content: center;
}

.left-column,
.center-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.left-column {
  flex: 1;
  min-width: 300px;
  align-items: center;
  margin-left: 50px;
  margin-top: 40px;
}

.center-column {
  flex: 1;
  min-width: 375px;
  align-items: center;
  margin-right: 100px;
  margin-top: 45px;
}

.right-column {
  flex: 1;
  min-width: 300px;
  margin-right: 170px;
}

.weather-info-card {
  width: 300px;
  height: 300px;
  padding: 20px;
  background-color: #FFFFFF;
  border-radius: 13px;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  line-height: 2.2;
}

.local-info-card-scroll {
  width: 300px;
  height: 300px;
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
  border-left: 6px solid #000;
}

.smoke-card {
  background-color: #000 !important;
  border-left: 6px solid #000;
}

.cctv-view {
  width: 570px;
  height: 300px;
  background-color: #FFFFFF;
  border-radius: 13px;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  display: flex;
  justify-content: center;
  align-items: center;
}

.map {
  width: 570px;
  height: 300px;
  border-radius: 13px;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
}

.filter-section {
  display: flex;
  gap: 24px;
  width: 600px;
  height: 700px;
  flex-direction: row;
  border-radius: 13px;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
  padding: 20px;
  background-color: #FFFFFF;
}

.filter-item {
  width: 100px;
  height: 40px;
  color: black;
}

.alert-dialog-card {
  background-color: #343a40;
  color: white;
  border: 2px solid rgba(255, 100, 100, 0.8);
  border-radius: 12px;
  box-shadow: 0 0 16px rgba(255, 100, 100, 0.4);
}

.letter {
  color: black;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.weather-info {
  margin-left: 20px;
  color: #406CDB;
  font-size: 20px;
  font-weight: 400;
}

.cause-card {
  width: 375px;
  height: 400px;
  background-color: #FFFFFF;
  border-radius: 13px;
  box-shadow: 0px 4px 11px -3px rgba(0, 0, 0, 0.31);
}

.bar-img {
  width: 100%;
  height: auto;
  padding-right: 65px;
  padding-left: 10px;
  padding-top: 20px;
}

.cctv-name {
  color: black;
}

.placeholder {
  color: #000000;
}

.media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>