<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { confirmPasswordReset, requestPasswordReset } from "../../api/auth";

const account = ref("");
const code = ref("");
const password = ref("");
const confirmation = ref("");
const showPassword = ref(false);
const showConfirmation = ref(false);
const loading = ref(false);
const message = ref("");
const messageType = ref<"error" | "success">("error");
const countdown = ref(0);
let timer: number | undefined;

const accountError = computed(() => account.value && !/^[a-zA-Z0-9_]{4,20}$/.test(account.value.trim()) ? "账号格式不正确" : "");
const passwordError = computed(() => {
  if (!password.value) return "";
  if (password.value.length < 8 || password.value.length > 32) return "密码需为 8-32 个字符，并包含至少一个英文字母和一个数字";
  return /[A-Za-z]/.test(password.value) && /\d/.test(password.value) ? "" : "密码需包含至少一个英文字母和一个数字";
});
const confirmationError = computed(() => confirmation.value && confirmation.value !== password.value ? "两次输入的密码不一致" : "");
const canRequest = computed(() => Boolean(account.value.trim()) && !accountError.value && countdown.value === 0);
const canSubmit = computed(() => Boolean(account.value.trim() && code.value.trim() && password.value && confirmation.value) && !accountError.value && !passwordError.value && !confirmationError.value);

function backToLogin() { window.location.hash = "#/login"; }
function showNotice(text: string, type: "error" | "success" = "error") { message.value = text; messageType.value = type; }
async function sendCode() {
  message.value = "";
  if (!canRequest.value) return;
  loading.value = true;
  try {
    const result = await requestPasswordReset(account.value.trim());
    showNotice(result.accountMasked ? `验证码已发送至 ${result.accountMasked}` : "验证码已发送", "success");
    countdown.value = 60;
    timer = window.setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0 && timer) window.clearInterval(timer);
    }, 1000);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "验证码发送失败");
  } finally { loading.value = false; }
}
async function submit() {
  message.value = "";
  if (!canSubmit.value) return;
  loading.value = true;
  try {
    await confirmPasswordReset(account.value.trim(), code.value.trim(), password.value);
    showNotice("密码重置成功，请使用新密码登录", "success");
    window.setTimeout(backToLogin, 900);
  } catch (error) {
    showNotice(error instanceof Error ? error.message : "密码重置失败，请稍后重试");
  } finally { loading.value = false; }
}
onBeforeUnmount(() => { if (timer) window.clearInterval(timer); });
</script>

<template>
  <div class="forgot-page">
    <section class="forgot-art"><div class="brand-art"><span>game</span>盒子</div><div class="art-title">找回账号密码</div><div class="art-subtitle">安全验证，重新开启游戏之旅</div></section>
    <section class="forgot-panel">
      <button class="close" aria-label="返回登录" @click="backToLogin">‹</button>
      <div class="content"><div class="brand"><span>game</span>盒子</div><h1>忘记密码</h1><p class="subtitle">通过账号验证后设置新的登录密码</p>
        <form @submit.prevent="submit" novalidate>
          <label class="field"><span>♙</span><input v-model.trim="account" autocomplete="username" placeholder="请输入账号" /><small v-if="accountError">{{ accountError }}</small></label>
          <label class="field"><span>▣</span><input v-model.trim="code" inputmode="numeric" maxlength="6" placeholder="请输入验证码" /><button type="button" :disabled="!canRequest || loading" @click="sendCode">{{ countdown ? `${countdown}s` : "获取验证码" }}</button></label>
          <label class="field"><span class="lock-icon" aria-hidden="true"></span><input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="请输入新密码，8-32位，需含字母和数字" /><button type="button" class="eye-button" @click="showPassword = !showPassword">{{ showPassword ? "◉" : "⌁" }}</button><small v-if="passwordError">{{ passwordError }}</small></label>
          <label class="field"><span class="lock-icon" aria-hidden="true"></span><input v-model="confirmation" :type="showConfirmation ? 'text' : 'password'" autocomplete="new-password" placeholder="请再次输入新密码" /><button type="button" class="eye-button" @click="showConfirmation = !showConfirmation">{{ showConfirmation ? "◉" : "⌁" }}</button><small v-if="confirmationError">{{ confirmationError }}</small></label>
          <p v-if="message" class="message" :class="messageType">{{ message }}</p>
          <button class="submit" type="submit" :disabled="loading">{{ loading ? "处理中…" : "确认重置密码" }}</button>
        </form>
      </div>
      <button class="back-link" @click="backToLogin">返回登录</button>
    </section>
  </div>
</template>

<style scoped>
:global(*){box-sizing:border-box}:global(body){margin:0;background:#20242f;color:#f7f4ed;font-family:Inter,"PingFang SC","Microsoft YaHei",sans-serif}button,input{font:inherit}.forgot-page{width:100vw;height:100vh;min-height:560px;display:flex;overflow:hidden;background:#20242f}.forgot-art{position:relative;flex:1;background:radial-gradient(circle at 55% 35%,#dfad70,#8b4c42 45%,#292634 100%);display:flex;flex-direction:column;align-items:center;justify-content:center}.brand-art{position:absolute;top:25px;left:32px;color:#efc128;font-size:25px;font-weight:900;font-style:italic}.brand-art span,.brand span{font-size:1.25em}.art-title{color:#ffe5a0;font-size:clamp(30px,5vw,70px);font-weight:900;text-shadow:0 4px 15px #572b25}.art-subtitle{margin-top:18px;color:#ffe0ad;letter-spacing:3px}.forgot-panel{position:relative;flex:0 0 36%;min-width:360px;background:#222632;display:flex;flex-direction:column;align-items:center}.close{position:absolute;top:20px;left:22px;background:transparent;border:0;color:#9498a6;font-size:28px}.content{width:min(310px,calc(100% - 54px));margin-top:48px}.brand{text-align:center;color:#eec11f;font-size:22px;font-weight:900;font-style:italic}.content h1{margin:31px 0 8px;text-align:center;font-size:20px}.subtitle{text-align:center;color:#8f929e;font-size:11px;margin:0 0 25px}.field{position:relative;display:flex;align-items:center;height:52px;margin-bottom:16px;border-radius:7px;background:#30333d}.field>span{width:42px;text-align:center;color:#858998}.field input{min-width:0;flex:1;height:100%;padding:0 6px 0 0;border:0;outline:0;background:transparent;color:#f3f0ea}.field input::placeholder{color:#888b98}.field button{height:100%;padding:0 10px;border:0;background:transparent;color:#e5c04d;font-size:11px}.field button:disabled{color:#777b86}.field small{position:absolute;left:2px;bottom:-15px;color:#dc7778;font-size:10px}.message{margin:-4px 0 12px;font-size:11px}.message.error{color:#df7779}.message.success{color:#75c895}.submit{width:100%;height:48px;border:0;border-radius:7px;background:#80651a;color:#19150c;cursor:pointer}.submit:disabled{opacity:.6}.back-link{margin-top:24px;color:#d8b84e;background:transparent;border:0;font-size:11px}@media(max-width:720px){.forgot-art{display:none}.forgot-panel{flex:1;min-width:0}}
.lock-icon{position:relative;display:inline-block;flex:0 0 42px;height:100%}.lock-icon::before{content:"";position:absolute;left:16px;top:20px;width:10px;height:8px;border:1.5px solid #858998;border-radius:2px}.lock-icon::after{content:"";position:absolute;left:18.5px;top:14px;width:5px;height:7px;border:1.5px solid #858998;border-bottom:0;border-radius:6px 6px 0 0}.eye-button{width:38px;padding:0!important;font-size:16px!important}
</style>
