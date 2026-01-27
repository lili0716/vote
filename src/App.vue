<script setup lang="ts">
import { RouterView } from "vue-router";
import { ConfigProvider } from "ant-design-vue";
</script>

<template>
  <ConfigProvider>
    <RouterView />
  </ConfigProvider>
</template>

<style scoped></style>
