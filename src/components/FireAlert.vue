<template>
  <div>
    <!-- 알림 메시지는 toast를 통해 표시됩니다 -->
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useToast } from 'vue-toastification'

// 효과음 파일 경로
import fireSound from '@/assets/sounds/fire.mp3'
import smokeSound from '@/assets/sounds/smoke.mp3'

const toast = useToast()

// 효과음 재생 함수
function playSound(type) {
  const audio = new Audio(type === '불' ? fireSound : smokeSound)
  audio.play()
}

// WebSocket 연결 및 이벤트 처리
onMounted(() => {
  const socket = io('http://localhost:10111') // 서버 주소에 맞게 수정

  // 2) 연결 직후 연결 상태를 콘솔에 찍어 봄
  console.log('🔌 소켓 연결 상태:', socket.connected)
  //    → true가 나오면 “서버와 WebSocket 연결이 됐다”고 볼 수 있음
  //    → false가 나오면 아직 연결되지 않았거나, 연결에 실패한 상태


  socket.on('fireDetected', (data) => {
    if (data.type === '불') {
      toast.error(`🔥 화재 감지됨!\n위치: ${data.location}\n신뢰도: ${data.confidence}%`)
    } else {
      toast.info(`💨 연기 감지됨!\n위치: ${data.location}\n신뢰도: ${data.confidence}%`)
    }
    playSound(data.type)
  })
})
</script>
