// CCTV 관련 API 호출을 위한 서비스 모듈
import axios from '@/plugins/axios'  // 프론트 전용 axios 인스턴스

// 내 Node.js 백엔드의 /api/cctv 엔드포인트를 호출
export async function fetchNearestCctv(lat, lng) {
  const res = await axios.get('/api/cctv', { params: { lat, lng } });
  // { cctv: { ... } } 형태로 돌아온다고 가정
  return res.data.cctv;
}
