// 날씨 api를 호출하는 서비스

import axios from 'axios'
export async function getWeather(lat, lon) {
  const apiKey = 'ecba72e2f4c6c042f4f0da626b102a92'; // API 키
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url)
    const data = response.data

    return {
      temp: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      windDeg: data.wind.deg,
      precipitation: data.rain?.['1h'] ?? 0,
    }
  } catch (err) {
    console.error('날씨 API 호출 실패:', err)
    throw err
  }
}