<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import HomeView from "./views/home/HomeView.vue";
import TasksView from "./views/tasks/TasksView.vue";
import RegisterView from "./views/auth/RegisterView.vue";
import LoginView from "./views/auth/LoginView.vue";
import ForgotPasswordView from "./views/auth/ForgotPasswordView.vue";
import AccountView from "./views/account/AccountView.vue";
import SearchView from "./views/search/SearchView.vue";
import ServerSelectView from "./views/games/ServerSelectView.vue";
import GameDetailView from "./views/games/GameDetailView.vue";
import GamesView from "./views/games/GamesView.vue";
import VipView from "./views/vip/VipView.vue";
// import LiveRoomView from "./views/live/LiveRoomView.vue";
import LiveView from "./views/live/LiveView.vue";
import { clearSession, isAuthenticated, saveAccountProfile } from "./utils/auth";
import { getCurrentAccountInfo } from "./api/account";

const hash = ref(window.location.hash || (isAuthenticated() ? "" : "#/login"));
const authenticated = ref(isAuthenticated());
const checkingSession = ref(authenticated.value);
const currentView = computed(() => {
  if (hash.value === "#/account") return authenticated.value ? AccountView : LoginView;
  if (hash.value === "#/register") return RegisterView;
  if (hash.value === "#/login") return LoginView;
  if (hash.value === "#/forgot-password") return ForgotPasswordView;
  if (hash.value.startsWith("#/search")) return SearchView;
  if (hash.value.startsWith("#/games/") && hash.value.includes("/servers")) return ServerSelectView;
  if (hash.value.startsWith("#/games/")) return GameDetailView;
  if (hash.value === "#/games") return GamesView;
  if (hash.value === "#/vip") return VipView;
  if (hash.value.startsWith("#/live/room/")) return LiveRoomView;
  if (hash.value === "#/live") return LiveView;
  if (["#/community", "#/news", "#/guild", "#/invite", "#/beauty"].includes(hash.value)) return HomeView;
  if (!authenticated.value) return LoginView;
  return hash.value === "#/tasks" ? TasksView : HomeView;
});
function syncHash() {
  hash.value = window.location.hash || (authenticated.value ? "" : "#/login");
  if (!authenticated.value && !["#/login", "#/register", "#/forgot-password"].includes(hash.value)) {
    window.location.hash = "#/login";
  }
}
function syncAuth() { authenticated.value = isAuthenticated(); syncHash(); }
async function validateSession() {
  if (!authenticated.value) { checkingSession.value = false; return; }
  try {
    const result = await getCurrentAccountInfo();
    if (result.user) saveAccountProfile(result.user);
  } catch {
    clearSession();
    authenticated.value = false;
    window.location.hash = "#/login";
  } finally { checkingSession.value = false; }
}
onMounted(() => window.addEventListener("hashchange", syncHash));
onMounted(validateSession);
onMounted(() => window.addEventListener("auth-change", syncAuth));
onUnmounted(() => window.removeEventListener("hashchange", syncHash));
onUnmounted(() => window.removeEventListener("auth-change", syncAuth));
</script>

<template>
  <div v-if="checkingSession" class="session-checking">正在验证登录状态…</div>
  <component v-else :is="currentView" />
</template>

<style scoped>
.session-checking { min-height: 100vh; display: grid; place-items: center; background: #111217; color: #c7a248; }
</style>
