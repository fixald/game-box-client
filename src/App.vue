<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import HomeView from "./views/home/HomeView.vue";
import TasksView from "./views/tasks/TasksView.vue";
import RegisterView from "./views/auth/RegisterView.vue";
import LoginView from "./views/auth/LoginView.vue";
import ForgotPasswordView from "./views/auth/ForgotPasswordView.vue";
import AccountView from "./views/account/AccountView.vue";
import SearchView from "./views/search/SearchView.vue";
import { isAuthenticated } from "./utils/auth";

const hash = ref(window.location.hash || (isAuthenticated() ? "" : "#/login"));
const authenticated = ref(isAuthenticated());
const currentView = computed(() => {
  if (hash.value === "#/account") return authenticated.value ? AccountView : LoginView;
  if (hash.value === "#/register") return RegisterView;
  if (hash.value === "#/login") return LoginView;
  if (hash.value === "#/forgot-password") return ForgotPasswordView;
  if (hash.value.startsWith("#/search")) return SearchView;
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
onMounted(() => window.addEventListener("hashchange", syncHash));
onMounted(() => window.addEventListener("auth-change", syncAuth));
onUnmounted(() => window.removeEventListener("hashchange", syncHash));
onUnmounted(() => window.removeEventListener("auth-change", syncAuth));
</script>

<template>
  <component :is="currentView" />
</template>
