<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import HomeView from "./views/home/HomeView.vue";
import TasksView from "./views/tasks/TasksView.vue";
import RegisterView from "./views/auth/RegisterView.vue";
import LoginView from "./views/auth/LoginView.vue";
import { isAuthenticated } from "./utils/auth";

const hash = ref(window.location.hash || "#/login");
const authenticated = ref(isAuthenticated());
const currentView = computed(() => {
  if (hash.value === "#/register") return RegisterView;
  if (hash.value === "#/login") return LoginView;
  if (!authenticated.value) return LoginView;
  return hash.value === "#/tasks" ? TasksView : HomeView;
});
function syncHash() {
  hash.value = window.location.hash || (authenticated.value ? "" : "#/login");
  if (!authenticated.value && !["#/login", "#/register"].includes(hash.value)) {
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
