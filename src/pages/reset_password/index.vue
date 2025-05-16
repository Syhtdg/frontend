<template>
  <v-container class="reset-container">
    <v-card class="reset-card">
      <v-card-title class="title">비밀번호 재설정</v-card-title>
      <v-card-text>
        <v-text-field label="아이디" v-model="ID" class="input-box" />
        <v-text-field label="이메일" v-model="EMAIL" class="input-box" />

        <!-- 새 비밀번호 필드 (toggle 기능 포함) -->
        <v-text-field
          label="새 비밀번호"
          v-model="newPassword"
          :type="showPassword ? 'password' : 'text'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="togglePassword"
          class="input-box"
        />

        <v-btn class="reset-btn" @click="resetPassword">
          비밀번호 변경
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import axios from '@/plugins/axios'

export default {
  data() {
    return {
      ID: '',
      EMAIL: '',
      newPassword: '',
      showPassword: true, // 기본값: 숨김 상태
    }
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword
    },
    async resetPassword() {
      try {
        const res = await axios.post('/resetPassword', {
          ID: this.ID,
          EMAIL: this.EMAIL,
          newPassword: this.newPassword,
        })
        alert(res.data.message)
        // 1초 뒤 로그인 페이지로 이동
        setTimeout(() => {
          this.$router.push('/login')
        }, 1000)
      } catch (err) {
        alert(err.response?.data?.message || '비밀번호 변경 실패')
      }
    },
  },
}
</script>

<style scoped>
.reset-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2a2a2a;
}

.reset-card {
  padding: 30px;
  max-width: 400px;
  width: 100%;
  background-color: #1e1e1e;
  color: white;
}

.title {
  font-size: 20px;
  color: #5cffd1;
  text-align: center;
  margin-bottom: 20px;
}

.input-box {
  margin-bottom: 15px;
}

.reset-btn {
  width: 100%;
  background-color: #ff3366;
  color: white;
  font-weight: bold;
}
</style>
