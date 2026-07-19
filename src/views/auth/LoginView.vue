<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { loginAccount } from "../../api/auth";
import { saveSession } from "../../utils/auth";

type LoginMode = "account" | "sms";
const mode = ref<LoginMode>("account");
const account = ref("");
const password = ref("");
const phone = ref("");
const smsCode = ref("");
const showPassword = ref(false);
const rememberAccount = ref(true);
const ACCOUNT_HISTORY_KEY = "gamebox_account_history";
const accountHistory = ref<string[]>(JSON.parse(localStorage.getItem(ACCOUNT_HISTORY_KEY) || "[]"));
const showHistory = ref(false);
const touched = ref(false);
const submitting = ref(false);
const countdown = ref(0);
const message = ref("");
const messageType = ref<"error" | "success">("error");
let countdownTimer: number | undefined;

const accountError = computed(() => {
  if (!touched.value && !account.value) return "";
  if (!account.value.trim()) return "请输入账号";
  return /^[a-zA-Z0-9_]{4,20}$/.test(account.value.trim()) ? "" : "账号格式不正确";
});
const passwordError = computed(() => {
  if (!touched.value && !password.value) return "";
  if (!password.value) return "请输入密码";
  return password.value.length >= 8 ? "" : "密码长度不能少于 8 位";
});
const phoneError = computed(() => {
  if (!touched.value && !phone.value) return "";
  if (!phone.value) return "请输入手机号";
  return /^1\d{10}$/.test(phone.value) ? "" : "手机号格式不正确";
});
const smsError = computed(() => {
  if (!touched.value && !smsCode.value) return "";
  return /^\d{6}$/.test(smsCode.value) ? "" : "请输入 6 位验证码";
});
const canSubmit = computed(() => mode.value === "account" ? !accountError.value && !passwordError.value && !!account.value && !!password.value : !phoneError.value && !smsError.value && !!phone.value && !!smsCode.value);

function switchMode(next: LoginMode) {
  mode.value = next;
  touched.value = false;
  message.value = "";
}
function selectAccount(value: string) { account.value = value; showHistory.value = false; }
function sendCode() {
  touched.value = true;
  if (phoneError.value || countdown.value > 0) return;
  countdown.value = 60;
  countdownTimer = window.setInterval(() => { countdown.value -= 1; if (countdown.value <= 0 && countdownTimer) window.clearInterval(countdownTimer); }, 1000);
  showNotice("验证码已发送", "success");
}
function showNotice(value: string, type: "error" | "success" = "error") { message.value = value; messageType.value = type; }
function goRegister() { window.location.hash = "#/register"; }
function closePage() { window.location.hash = ""; }
function forgotPassword() { window.location.hash = "#/forgot-password"; }
function customerService() { showNotice("客服咨询功能即将开放"); }
async function submitLogin() {
  touched.value = true;
  message.value = "";
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    if (mode.value === "account") {
      const result = await loginAccount(account.value.trim(), password.value, rememberAccount.value);
      const currentAccount = result.user?.account || account.value.trim();
      if (!accountHistory.value.includes(currentAccount)) {
        accountHistory.value.unshift(currentAccount);
        localStorage.setItem(ACCOUNT_HISTORY_KEY, JSON.stringify(accountHistory.value.slice(0, 10)));
      }
      saveSession(result.accessToken, currentAccount, rememberAccount.value);
    } else {
      // 短信登录接口尚未接入，保留现有页面提示。
      showNotice("短信登录功能暂未接入", "error");
      return;
    }
    showNotice("登录成功，正在进入盒子…", "success");
    window.setTimeout(() => { window.location.hash = ""; }, 900);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "登录失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
}
onBeforeUnmount(() => { if (countdownTimer) window.clearInterval(countdownTimer); });
</script>

<template>
  <div class="login-page">
    <section class="login-art" aria-label="游戏宣传区域">
      <div class="art-sky"></div><div class="art-sun"></div><div class="art-mountain mountain-back"></div><div class="art-mountain mountain-front"></div><div class="hero-warrior warrior-left">◒</div><div class="hero-warrior warrior-right">♞</div><div class="hero-sword">⚔</div>
      <div class="brand-hero"><span>game</span><strong>盒子</strong></div><div class="game-logo"><small>game</small><b>传奇世界</b><i>热血 · 兄弟 · 荣耀</i></div><div class="art-spark spark-one">✦　·　✧</div><div class="art-spark spark-two">·　✦　·</div>
    </section>
    <section class="login-panel">
      <button class="close-button" aria-label="关闭" @click="closePage">×</button>
      <div class="panel-content">
        <div class="brand-small"><span>game</span>盒子</div>
        <div class="login-tabs"><button :class="{ active: mode === 'account' }" @click="switchMode('account')">账号登录</button><i></i><button :class="{ active: mode === 'sms' }" @click="switchMode('sms')">短信登录</button></div>
        <form @submit.prevent="submitLogin" novalidate>
          <template v-if="mode === 'account'">
            <label class="input-wrap account-input" :class="{ invalid: accountError }"><span class="input-icon">♙</span><input v-model.trim="account" autocomplete="username" placeholder="game 游戏账号 / 盒子号" @focus="showHistory = true" @blur="touched = true" /><button type="button" class="dropdown-button" @mousedown.prevent="showHistory = !showHistory">⌄</button><span v-if="accountError" class="field-error">{{ accountError }}</span><div v-if="showHistory && accountHistory.length" class="history-popover"><button v-for="item in accountHistory" :key="item" type="button" @mousedown.prevent="selectAccount(item)">{{ item }} <span>›</span></button></div></label>
            <label class="input-wrap password-input" :class="{ invalid: passwordError }"><span class="input-icon">♙</span><input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="请输入密码" @blur="touched = true" /><button type="button" class="eye-button" @click="showPassword = !showPassword">{{ showPassword ? "◉" : "⌁" }}</button><span v-if="passwordError" class="field-error">{{ passwordError }}</span></label>
            <div class="login-options"><button type="button" class="remember" :class="{ checked: rememberAccount }" @click="rememberAccount = !rememberAccount"><i>✓</i>记住账号</button><span><button type="button" class="customer-service-button" @click="customerService">客服咨询</button><b>|</b><button type="button" @click="goRegister">注册</button><b>|</b><button type="button" @click="forgotPassword">忘记密码</button></span></div>
          </template>
          <template v-else>
            <label class="input-wrap" :class="{ invalid: phoneError }"><span class="input-icon">♙</span><input v-model.trim="phone" inputmode="numeric" autocomplete="tel" placeholder="请输入手机号" @blur="touched = true" /><span v-if="phoneError" class="field-error">{{ phoneError }}</span></label>
            <label class="input-wrap" :class="{ invalid: smsError }"><span class="input-icon">▣</span><input v-model.trim="smsCode" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="请输入短信验证码" @blur="touched = true" /><button type="button" class="code-button" :disabled="countdown > 0" @click="sendCode">{{ countdown > 0 ? `${countdown}s` : "获取验证码" }}</button><span v-if="smsError" class="field-error">{{ smsError }}</span></label><div class="sms-helper"><button type="button" @click="switchMode('account')">使用账号密码登录</button></div>
          </template>
          <p v-if="message" class="form-message" :class="messageType">{{ message }}</p><button class="submit-button" type="submit" :disabled="submitting">{{ submitting ? "登录中…" : "登录" }}</button>
        </form>
      </div>
      <p class="agreement">登录即同意 <a href="#" @click.prevent="showNotice('用户注册协议即将开放')">《用户注册协议》</a>、<a href="#" @click.prevent="showNotice('隐私条款即将开放')">《隐私条款》</a>、<a href="#" @click.prevent="showNotice('儿童隐私保护协议即将开放')">《儿童隐私保护协议》</a></p>
    </section>
  </div>
</template>

<style scoped>
:global(*) { box-sizing: border-box; }:global(body) { margin: 0; overflow: hidden; background: #20242f; color: #f7f4ed; font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif; } button, input { font: inherit; }.login-page { width: 100vw; height: 100vh; min-height: 560px; display: flex; overflow: hidden; background: #20242f; }.login-art { position: relative; flex: 1 1 64%; overflow: hidden; background: linear-gradient(150deg, #f8ecd6 0, #e8bf8b 45%, #74483b 100%); }.art-sky { position: absolute; inset: 0; background: radial-gradient(ellipse at 58% 20%, rgba(255,249,225,.98), transparent 28%), radial-gradient(ellipse at 27% 72%, rgba(255,203,135,.8), transparent 25%), linear-gradient(170deg, #f7eedb 0, #dca87b 62%, #6e4239 100%); }.art-sun { position: absolute; width: 170px; height: 170px; top: 25%; left: 49%; border-radius: 50%; background: rgba(255,239,166,.9); filter: blur(18px); box-shadow: 0 0 70px 35px rgba(255,214,121,.5); }.art-mountain { position: absolute; bottom: -10%; width: 80%; height: 58%; opacity: .7; transform: rotate(-12deg); }.mountain-back { left: -12%; background: linear-gradient(135deg, transparent 30%, #8f5b51 31% 36%, transparent 37% 48%, #76423e 49% 60%, transparent 61%); }.mountain-front { right: -18%; background: linear-gradient(145deg, transparent 32%, #5f3940 33% 49%, transparent 50% 60%, #422d3a 61%); }.hero-warrior { position: absolute; z-index: 2; color: rgba(80,44,35,.68); font-size: clamp(130px, 21vw, 270px); line-height: 1; }.warrior-left { left: -3%; bottom: 10%; transform: rotate(-18deg); }.warrior-right { right: 2%; bottom: 8%; transform: rotate(12deg); }.hero-sword { position: absolute; z-index: 3; left: 45%; top: 30%; color: #f8df99; font-size: clamp(55px, 8vw, 110px); transform: rotate(-22deg); text-shadow: 0 0 18px #e98c42; }.brand-hero { position: absolute; z-index: 4; top: 23px; left: 32px; display: flex; gap: 4px; color: #eebd18; font-size: clamp(17px, 2vw, 28px); font-weight: 900; font-style: italic; }.game-logo { position: absolute; z-index: 4; top: 40%; left: 50%; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); color: #fff1b7; text-align: center; text-shadow: 0 5px 0 #6a2b1c, 0 0 18px #fa9d3d; white-space: nowrap; }.game-logo small { font-size: clamp(25px, 4vw, 56px); font-weight: 900; }.game-logo b { margin-top: -12px; font-size: clamp(40px, 7vw, 94px); line-height: .95; font-family: serif; }.game-logo i { margin-top: 14px; color: #ffe6a3; font-size: clamp(10px, 1.2vw, 16px); font-style: normal; letter-spacing: 7px; }.art-spark { position: absolute; z-index: 2; color: rgba(255,245,207,.75); font-size: 19px; }.spark-one { top: 12%; left: 32%; }.spark-two { top: 16%; right: 20%; }.login-panel { position: relative; flex: 0 0 36%; min-width: 360px; display: flex; flex-direction: column; align-items: center; background: #222632; }.close-button { position: absolute; top: 22px; right: 22px; border: 0; background: transparent; color: #9498a6; cursor: pointer; font-size: 25px; }.close-button:hover { color: #e4bf50; }.panel-content { width: min(282px, calc(100% - 54px)); margin-top: 48px; }.brand-small { display: flex; justify-content: center; gap: 4px; color: #eec11f; font-size: 22px; font-weight: 900; font-style: italic; text-shadow: 1px 2px #5f4016; }.brand-small span { font-size: 1.2em; }.login-tabs { display: flex; align-items: center; justify-content: center; gap: 18px; margin: 32px 0 25px; }.login-tabs button { padding: 0; border: 0; background: transparent; color: #999ba5; cursor: pointer; font-size: 17px; font-weight: 700; }.login-tabs button.active { color: #efc63e; }.login-tabs i { width: 1px; height: 17px; background: #777982; }.input-wrap { position: relative; display: flex; align-items: center; height: 56px; margin-bottom: 16px; border: 1px solid transparent; border-radius: 7px; background: #30333d; }.input-wrap:first-child { border-color: #b78e25; background: #242832; }.input-wrap.invalid { border-color: #c65d61; }.input-icon { width: 42px; color: #858998; text-align: center; font-size: 18px; }.input-wrap input { min-width: 0; flex: 1; height: 100%; padding: 0 5px 0 0; border: 0; outline: 0; background: transparent; color: #f3f0ea; font-size: 13px; }.input-wrap input::placeholder { color: #888b98; }.eye-button, .dropdown-button, .code-button { border: 0; background: transparent; cursor: pointer; }.eye-button { width: 38px; color: #d9b839; }.dropdown-button { width: 38px; color: #9a9ca8; font-size: 20px; }.code-button { padding: 0 10px; color: #e5c04d; font-size: 11px; }.code-button:disabled { color: #797b85; cursor: wait; }.field-error { position: absolute; left: 2px; bottom: -16px; color: #dc7778; font-size: 10px; }.history-popover { position: absolute; z-index: 3; top: 60px; left: 0; right: 0; padding: 5px; border: 1px solid #454752; border-radius: 6px; background: #2c2f39; box-shadow: 0 8px 25px rgba(0,0,0,.35); }.history-popover button { width: 100%; padding: 9px 10px; display: flex; justify-content: space-between; border: 0; border-radius: 4px; background: transparent; color: #c7c8ce; text-align: left; font-size: 11px; }.history-popover button:hover { background: #3b3d48; color: #edc652; }.login-options { display: flex; justify-content: space-between; align-items: center; margin: 1px 0 25px; color: #a3a4ad; font-size: 10px; }.login-options button, .sms-helper button { padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; font-size: inherit; }.login-options button:hover, .sms-helper button:hover { color: #e5c04d; }.login-options b { margin: 0 6px; color: #646670; font-weight: 400; }.remember { display: flex; gap: 5px; align-items: center; }.remember i { width: 18px; height: 18px; display: grid; place-items: center; border: 2px solid #8d909d; border-radius: 50%; color: transparent; font-size: 11px; font-style: normal; }.remember.checked i { border-color: #ddb941; color: #ddb941; }.sms-helper { margin: -5px 0 24px; color: #9b9da6; text-align: right; font-size: 10px; }.form-message { margin: -5px 0 12px; font-size: 11px; }.form-message.error { color: #df7779; }.form-message.success { color: #75c895; }.submit-button { width: 100%; height: 48px; border: 0; border-radius: 7px; background: #80651a; color: #19150c; cursor: pointer; font-size: 14px; }.submit-button:hover { background: #a78324; }.submit-button:disabled { opacity: .6; cursor: wait; }.agreement { position: absolute; left: 20px; right: 20px; bottom: 18px; margin: 0; color: #9a9ca5; text-align: center; font-size: 10px; line-height: 1.6; }.agreement a { color: #e8c047; text-decoration: none; }.agreement a:hover { text-decoration: underline; }
@media (max-width: 720px) { .login-art { display: none; }.login-panel { flex: 1; min-width: 0; }.panel-content { width: min(340px, calc(100% - 50px)); } }
<style scoped>
/* 覆盖 Chromium/WebKit 自动填充的浅色背景，保持深色登录主题。 */
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
.password-input,
.password-input:hover,
.password-input:focus-within { background: #30333d; }
.password-input input:-webkit-autofill,
.password-input input:-webkit-autofill:hover,
.password-input input:-webkit-autofill:focus,
.password-input input:-webkit-autofill:active {
  -webkit-text-fill-color: #f3f0ea;
  -webkit-box-shadow: 0 0 0 1000px #30333d inset;
  box-shadow: 0 0 0 1000px #30333d inset;
  background-color: #30333d !important;
}
.account-input,
.account-input:hover,
.account-input:focus-within { background: #242832; }
.account-input input:-webkit-autofill,
.account-input input:-webkit-autofill:hover,
.account-input input:-webkit-autofill:focus,
.account-input input:-webkit-autofill:active {
  -webkit-text-fill-color: #f3f0ea;
  -webkit-box-shadow: 0 0 0 1000px #242832 inset;
  box-shadow: 0 0 0 1000px #242832 inset;
  background-color: #242832 !important;
}
.customer-service-button,
.customer-service-button + b { display: none !important; }
</style>
