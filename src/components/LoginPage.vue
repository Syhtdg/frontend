// LoginPage.vue
<template>
  <v-container fluid class="login-container">
    <div class="login-box">
      <div class="left">
        <h1 class="title">Login</h1>

        <v-text-field
          label="ID"
          color="grey"
          class="input-box"
          v-model="ID"
        ></v-text-field>

        <v-text-field
          :append-inner-icon="visible ? 'mdi-eye' : 'mdi-eye-off'"
          :type="visible ? 'text' : 'password'"
          label="PW"
          color="grey"
          class="input-box"
          @click:append-inner="togglePWvisibility"
          v-model="PASSWORD"
        ></v-text-field>

        <v-btn @click.prevent="handleLogin" class="login-btn">로그인</v-btn>

        <div class="link">
          <a @click.prevent="$router.push('/find_ID')" class="link-txt">아이디 찾기</a> |
          <a @click.prevent="$router.push('/reset_password')" class="link-txt">비밀번호 찾기</a> |
          <a @click.prevent="goSignUp" class="link-txt">회원가입</a>
        </div>
      </div>

      <div class="right">
        <img src="@/assets/right_side_logo.png" class="logo" />

        <div class="comment-ko-container">
          <img src="@/assets/Line 2.png" class="short-bar" />
          <p class="comment-ko">
            <span class="highlight">AI</span>를 활용한 시스템을 통해<br />
            누구보다 <span class="highlight">빠르게</span> 화재를 감지하세요
          </p>
        </div>
        <div class="comment-en-container">
          <img src="@/assets/Line 3.png" class="short-bar" />
          <p class="comment-en">
            Detect fire faster<br />
            than anyone else<br />
            with a system that uses AI
          </p>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script>
import axios from '@/plugins/axios'; // ✅ axios 인스턴스 사용

export default {
  data() {
    return {
      ID: '',
      PASSWORD: '',
      visible: false
    };
  },
  methods: {
    togglePWvisibility() {
      this.visible = !this.visible;
    },
    goSignUp() {
      this.$router.push({ path: "/signup" });
    },
    async handleLogin() {
      try {
        const response = await axios.post('/login', {
          ID: this.ID,
          PASSWORD: this.PASSWORD
        });

        if (response.data.token) {
          localStorage.setItem('token', response.data.token); // ✅ 토큰 저장
          this.$router.push('/dashboard'); // ✅ 로그인 성공 후 이동
        } else {
          alert('로그인 실패: 토큰 없음');
        }
      } catch (error) {
        alert('로그인 실패: ' + (error.response?.data?.message || '서버 오류'));
      }
    }
  }
};
</script>
  
  <style scoped>
  .login-container {
    background: url('@/assets/로그인 배경 화면2.png') no-repeat center center;
    background-size: cover;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .login-box {
    width: 80%;
    max-width: 1000px;
    height: 500px;
    background-color: rgba(40, 40, 40, 0.7);
    display: flex;
    border-radius: 15px;
    padding: 30px;
    color: white;
  }
  
  
  .left,
  .right {
    flex: 1;
    padding: 20px;
    display: block;
    flex-direction: column;
    justify-content: center;
  }
  
  .title {
    font-size: 32px;
    margin-bottom: 30px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.69);
    font-family: 'Pretendard Variable';
    letter-spacing: 1.84px;
  }
  
  .input-box {
    margin-bottom: 20px;
  }
  
  .login-btn {
    width: 100%;
    height: 60px;
    background-color: #A30505;
    color: white;
    font-weight: 300;
    letter-spacing: 1.84px;
    font-family: 'Pretendard Variable';
    margin-top: 10px;
    margin-bottom: 40px;
    border-radius: 7px;
  }
  
  .link {
    margin-top: 0px;
    font-size: 12px;
    font-weight: 200;
    text-align: center;
  }
  
  .link-txt {
    color: #fff;
    margin: 0 8px;
    text-decoration: none;
    cursor: pointer;
  }
  
  .right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    margin-left: 40px;
  }
  
  .logo {
    width: 278px;
    height: 74px;
    margin-bottom: 55px;
  }

  .comment-ko-container{
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .comment-ko {
    margin-left: 16px;
    font-weight: 200;
    color: #ffffffb7;
    font-size: 14px;
    line-height: 1.6;
    letter-spacing: 1.84px;
    margin-right: 18px;
    font-family: 'Pretendard Variable';
  }
  
  .highlight {
    font-weight: 400;
    color: #ff3c3c;
  }

  .comment-en-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  
  .comment-en {
    margin-left: 16px;
    color: #ffffffb7;
    font-weight: 200;
    font-size: 14px;
    line-height: 1.6;
    margin-right: 18px;
    letter-spacing: 1.84px;
    font-family: 'Pretendard Variable';
  }
  </style>