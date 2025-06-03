// plugins/vuetify.js

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import { ko } from 'vuetify/locale' // ✅ 한국어 locale 추가

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
  },
  icons: {
    defaultSet: 'mdi', // ✅ 오타 수정: defaults ❌ → defaultSet ✅
  },
  locale: {
    locale: 'ko',       // ✅ 기본 언어 설정
    messages: { ko },   // ✅ 메시지 등록
  },
})
