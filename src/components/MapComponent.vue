<template>
  <div ref="mapContainer" class="map"></div>
</template>

<script setup>
import { ref, onMounted, onActivated, defineEmits, defineExpose } from 'vue'
import axios from '@/plugins/axios'        // proxy 자동 적용된 axios

const emit = defineEmits(['select-marker'])
const mapContainer = ref(null)
let map = null
let kakaoMarkers = []

defineExpose({
  removeMarker(idx) {
    const m = kakaoMarkers[idx]
    if (m) m.setMap(null)
    kakaoMarkers[idx] = null
  }
})

function clearMarkers() {
  kakaoMarkers.forEach(m => m && m.setMap(null))
  kakaoMarkers = []
}

function renderMarkers(list) {
  list.forEach((loc, idx) => {
    const pos = new kakao.maps.LatLng(loc.lat, loc.lon)
    const mk = new kakao.maps.Marker({ map, position: pos })
    mk.idx = idx
    kakao.maps.event.addListener(mk, 'click', () => {
      emit('select-marker', {
        idx,
        lat: loc.lat,
        lng: loc.lon,
        name: loc.name || `CCTV #${idx}`
      })
    })
    kakaoMarkers.push(mk)
  })
}

async function loadLocations() {
  try {
    const { data } = await axios.get('/api/locations')
    return data
  } catch (err) {
    console.error('CCTV 위치 로드 실패:', err)
    return []
  }
}

async function initMap() {
  // 1) SDK가 없으면 로드
  if (!window.kakao || !window.kakao.maps) {
    await new Promise(resolve => {
      const script = document.createElement('script')
      script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=7287e30fdbe7200a54db305e55034cce&autoload=false'
      script.onload = resolve
      document.head.appendChild(script)
    })
  }
  // 2) SDK 초기화
  await new Promise(resolve => window.kakao.maps.load(resolve))
  // 3) 지도 생성 (한 번만)
  if (!map) {
    map = new kakao.maps.Map(mapContainer.value, {
      center: new kakao.maps.LatLng(35.82208889, 128.7434639),
      level: 8
    })
  }
  // 4) 마커 그리기
  clearMarkers()
  const locs = await loadLocations()
  renderMarkers(locs)
}

onMounted(initMap)
onActivated(initMap)    // keep-alive 로 복귀해도 다시 그려줌
</script>

<style scoped>
.map { width: 100%; height: 100%; }
</style>
