<script setup lang="ts">
import { computed, ref } from "vue";
import { registerAccount } from "../../api/auth";
import { saveSession } from "../../utils/auth";

const account = ref("");
const password = ref("");
const passwordConfirmation = ref("");
const showPassword = ref(false);
const showConfirmation = ref(false);
const submitting = ref(false);
const touched = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const accountError = computed(() => {
  if (!touched.value && !account.value) return "";
  if (!account.value.trim()) return "请输入账号";
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(account.value.trim())) return "账号需为 4-20 位字母、数字或下划线";
  return "";
});

const passwordError = computed(() => {
  if (!touched.value && !password.value) return "";
  if (!password.value) return "请输入密码";
  if (password.value.length < 8 || password.value.length > 32) return "密码需为 8-32 个字符，并包含至少一个英文字母和一个数字";
  if (!/[A-Za-z]/.test(password.value) || !/\d/.test(password.value)) return "密码需包含至少一个英文字母和一个数字";
  return "";
});

const confirmationError = computed(() => {
  if (!touched.value && !passwordConfirmation.value) return "";
  if (!passwordConfirmation.value) return "请再次输入密码";
  if (passwordConfirmation.value !== password.value) return "两次输入的密码不一致";
  return "";
});

const canSubmit = computed(() => !accountError.value && !passwordError.value && !confirmationError.value && Boolean(account.value && password.value && passwordConfirmation.value));

function backToLogin() {
  window.location.hash = "#/login";
}

function closePage() {
  window.location.hash = "";
}

function validate() {
  touched.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  return canSubmit.value;
}

async function register() {
  if (!validate()) return;
  submitting.value = true;
  try {
    const result = await registerAccount(account.value.trim(), password.value, passwordConfirmation.value);
    saveSession(result.accessToken, result.user?.account || account.value.trim());
    successMessage.value = "注册成功，正在进入盒子…";
    window.setTimeout(() => { window.location.hash = ""; }, 900);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "注册失败，请稍后重试";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="register-page">
    <section class="register-art" aria-label="游戏宣传区域">
      <div class="art-sky"></div><div class="art-sun"></div><div class="art-mountain mountain-back"></div><div class="art-mountain mountain-front"></div>
      <div class="hero-warrior warrior-left">◒</div><div class="hero-warrior warrior-right">♞</div><div class="hero-sword">⚔</div>
      <div class="brand-hero"><span>game</span><strong>盒子</strong></div>
      <div class="game-logo"><small>game</small><b>传奇世界</b><i>热血 · 兄弟 · 荣耀</i></div>
      <div class="art-spark spark-one">✦　·　✧</div><div class="art-spark spark-two">·　✦　·</div>
    </section>

    <section class="register-panel">
      <button class="back-button" aria-label="返回登录" @click="backToLogin">‹</button>
      <button class="close-button" aria-label="关闭" @click="closePage">×</button>
      <div class="panel-content">
        <div class="brand-small"><span>game</span>盒子</div>
        <h1>注册账号</h1>
        <p class="subtitle">game传奇引擎玩家可直接使用游戏账号登录</p>

        <form @submit.prevent="register" novalidate>
          <label class="input-wrap" :class="{ invalid: accountError }"><span class="input-icon">♙</span><input v-model.trim="account" autocomplete="username" placeholder="请输入账号" @blur="touched = true" /><span v-if="accountError" class="field-error">{{ accountError }}</span></label>
          <label class="input-wrap" :class="{ invalid: passwordError }"><span class="input-icon lock-icon" aria-hidden="true"></span><input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="8-32位，需含字母和数字" @blur="touched = true" /><button type="button" class="eye-button" @click="showPassword = !showPassword">{{ showPassword ? "◉" : "⌁" }}</button><span v-if="passwordError" class="field-error">{{ passwordError }}</span></label>
          <label class="input-wrap" :class="{ invalid: confirmationError }"><span class="input-icon lock-icon" aria-hidden="true"></span><input v-model="passwordConfirmation" :type="showConfirmation ? 'text' : 'password'" autocomplete="new-password" placeholder="再次输入密码，请保持一致" @blur="touched = true" /><button type="button" class="eye-button" @click="showConfirmation = !showConfirmation">{{ showConfirmation ? "◉" : "⌁" }}</button><span v-if="confirmationError" class="field-error">{{ confirmationError }}</span></label>
          <p v-if="errorMessage" class="form-message error">{{ errorMessage }}</p><p v-if="successMessage" class="form-message success">{{ successMessage }}</p>
          <button class="submit-button" type="submit" :disabled="submitting">{{ submitting ? "注册中…" : "立即注册" }}</button>
        </form>
      </div>
      <p class="agreement">注册即同意 <a href="#" @click.prevent="errorMessage = '用户注册协议即将开放'">《用户注册协议》</a>、<a href="#" @click.prevent="errorMessage = '隐私条款即将开放'">《隐私条款》</a>、<a href="#" @click.prevent="errorMessage = '儿童隐私保护协议即将开放'">《儿童隐私保护协议》</a></p>
    </section>
  </div>
</template>

<style scoped>
:global(*) { box-sizing: border-box; }
:global(body) { margin: 0; overflow: hidden; background: #1e222d; color: #f7f4ed; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; }
button, input { font: inherit; }.register-page { width: 100vw; height: 100vh; min-height: 560px; display: flex; overflow: hidden; background: #20242f; }.register-art { position: relative; flex: 1 1 64%; overflow: hidden; background: linear-gradient(150deg, #f8ecd6 0, #e8bf8b 45%, #74483b 100%); }.art-sky { position: absolute; inset: 0; background: radial-gradient(ellipse at 58% 20%, rgba(255,249,225,.98), transparent 28%), radial-gradient(ellipse at 27% 72%, rgba(255,203,135,.8), transparent 25%), linear-gradient(170deg, #f7eedb 0, #dca87b 62%, #6e4239 100%); }.art-sun { position: absolute; width: 170px; height: 170px; top: 25%; left: 49%; border-radius: 50%; background: rgba(255,239,166,.9); filter: blur(18px); box-shadow: 0 0 70px 35px rgba(255,214,121,.5); }.art-mountain { position: absolute; bottom: -10%; width: 80%; height: 58%; opacity: .7; transform: rotate(-12deg); }.mountain-back { left: -12%; background: linear-gradient(135deg, transparent 30%, #8f5b51 31% 36%, transparent 37% 48%, #76423e 49% 60%, transparent 61%); }.mountain-front { right: -18%; background: linear-gradient(145deg, transparent 32%, #5f3940 33% 49%, transparent 50% 60%, #422d3a 61%); }.hero-warrior { position: absolute; z-index: 2; color: rgba(80,44,35,.68); text-shadow: 10px 10px 0 rgba(255,226,166,.2); font-size: clamp(130px, 21vw, 270px); line-height: 1; }.warrior-left { left: -3%; bottom: 10%; transform: rotate(-18deg); color: rgba(65,49,49,.7); }.warrior-right { right: 2%; bottom: 8%; color: rgba(75,43,37,.73); transform: rotate(12deg); }.hero-sword { position: absolute; z-index: 3; left: 45%; top: 30%; color: #f8df99; font-size: clamp(55px, 8vw, 110px); transform: rotate(-22deg); text-shadow: 0 0 18px #e98c42; }.brand-hero { position: absolute; z-index: 4; top: 23px; left: 32px; display: flex; align-items: center; gap: 4px; color: #eebd18; font-size: clamp(17px, 2vw, 28px); font-weight: 900; font-style: italic; text-shadow: 1px 2px 0 #744410; }.brand-hero span { font-size: 1.35em; }.game-logo { position: absolute; z-index: 4; top: 40%; left: 50%; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); color: #fff1b7; text-align: center; text-shadow: 0 5px 0 #6a2b1c, 0 0 18px #fa9d3d; white-space: nowrap; }.game-logo small { font-size: clamp(25px, 4vw, 56px); font-weight: 900; }.game-logo b { margin-top: -12px; font-size: clamp(40px, 7vw, 94px); line-height: .95; font-family: serif; }.game-logo i { margin-top: 14px; color: #ffe6a3; font-size: clamp(10px, 1.2vw, 16px); font-style: normal; letter-spacing: 7px; }.art-spark { position: absolute; z-index: 2; color: rgba(255,245,207,.75); font-size: 19px; }.spark-one { top: 12%; left: 32%; }.spark-two { top: 16%; right: 20%; }
.register-panel { position: relative; flex: 0 0 36%; min-width: 360px; display: flex; flex-direction: column; align-items: center; background: #222632; }.back-button, .close-button { position: absolute; top: 22px; z-index: 2; border: 0; background: transparent; color: #9498a6; cursor: pointer; font-size: 27px; line-height: 1; }.back-button { left: 22px; }.close-button { right: 22px; font-size: 25px; }.back-button:hover, .close-button:hover { color: #e4bf50; }.panel-content { width: min(282px, calc(100% - 54px)); margin-top: 48px; }.brand-small { display: flex; justify-content: center; align-items: center; gap: 4px; color: #eec11f; font-size: 22px; font-style: italic; font-weight: 900; text-shadow: 1px 2px #5f4016; }.brand-small span { font-size: 1.2em; }.panel-content h1 { margin: 31px 0 8px; color: #f4f2ef; text-align: center; font-size: 19px; }.subtitle { margin: 0 0 24px; color: #8f929e; text-align: center; font-size: 11px; white-space: nowrap; }.input-wrap { position: relative; display: flex; align-items: center; height: 56px; margin-bottom: 16px; border: 1px solid transparent; border-radius: 7px; background: #30333d; }.input-wrap:first-child { border-color: #b78e25; background: #242832; }.input-wrap.invalid { border-color: #c65d61; }.input-icon { width: 42px; color: #858998; text-align: center; font-size: 18px; }.input-wrap input { min-width: 0; flex: 1; height: 100%; padding: 0 8px 0 0; border: 0; outline: 0; background: transparent; color: #f3f0ea; font-size: 13px; }.input-wrap input::placeholder { color: #888b98; }.eye-button { width: 38px; height: 100%; padding: 0; border: 0; background: transparent; color: #d9b839; cursor: pointer; }.field-error { position: absolute; left: 2px; bottom: -16px; color: #dc7778; font-size: 10px; }.form-message { margin: -2px 0 12px; font-size: 11px; }.form-message.error { color: #df7779; }.form-message.success { color: #75c895; }.submit-button { width: 100%; height: 48px; margin-top: 8px; border: 0; border-radius: 7px; background: #80651a; color: #19150c; cursor: pointer; font-size: 14px; }.submit-button:hover { background: #a78324; }.submit-button:disabled { opacity: .6; cursor: wait; }.agreement { position: absolute; left: 20px; right: 20px; bottom: 18px; margin: 0; color: #9a9ca5; text-align: center; font-size: 10px; line-height: 1.6; }.agreement a { color: #e8c047; text-decoration: none; }.agreement a:hover { text-decoration: underline; }
@media (max-width: 720px) { .register-art { display: none; }.register-panel { flex: 1; min-width: 0; }.panel-content { width: min(340px, calc(100% - 50px)); }.agreement { bottom: 12px; } }
<style scoped>
.lock-icon { position: relative; display: inline-block; height: 100%; }
.lock-icon::before { content: ""; position: absolute; left: 16px; top: 20px; width: 10px; height: 8px; border: 1.5px solid #858998; border-radius: 2px; }
.lock-icon::after { content: ""; position: absolute; left: 18.5px; top: 14px; width: 5px; height: 7px; border: 1.5px solid #858998; border-bottom: 0; border-radius: 6px 6px 0 0; }
/* 注册页同样覆盖浏览器自动填充样式。 */
.input-wrap input:-webkit-autofill,
.input-wrap input:-webkit-autofill:hover,
.input-wrap input:-webkit-autofill:focus,
.input-wrap input:-webkit-autofill:active {
  -webkit-text-fill-color: #f3f0ea;
  -webkit-box-shadow: 0 0 0 1000px #242832 inset;
  box-shadow: 0 0 0 1000px #242832 inset;
  caret-color: #f3f0ea;
  background-color: #242832 !important;
  transition: background-color 0s;
}
.input-wrap input,
.input-wrap input:hover,
.input-wrap input:focus { background: transparent !important; }
.input-wrap:hover { background: #30333d; }
.input-wrap:first-child:hover,
.input-wrap:focus-within { background: #242832; }

/* Chrome/Safari autofill can paint a light background over password fields. */
.input-wrap input:-webkit-autofill,
.input-wrap input:-webkit-autofill:hover,
.input-wrap input:-webkit-autofill:focus,
.input-wrap input:-webkit-autofill:active {
  -webkit-text-fill-color: #f3f0ea !important;
  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
  box-shadow: 0 0 0 1000px transparent inset !important;
  -webkit-background-clip: text !important;
  background-color: transparent !important;
  caret-color: #f3f0ea;
  transition: background-color 99999s ease-out 0s;
}
</style>
