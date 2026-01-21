<template>
  <div class="container">
    <h1>Welcome to Your Vue.js App</h1>
    <p>This is a simple welcome component.</p>
    <div class="item-container">
      <div class="item_lable">最佳创意奖</div>
      <div class="item"></div>
      <div class="item"></div>
      <div class="item"></div>
    </div>
    <div class="item-container">
      <div class="item_lable">最佳团队奖</div>
      <div class="item"></div>
      <div class="item"></div>
      <div class="item"></div>
    </div>
    <div class="item-container">
      <div class="item_lable">最具氛围奖</div>
      <div class="item"></div>
      <div class="item"></div>
      <div class="item"></div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style scoped lang="scss">
.container {
  text-align: center;
  background-color: red;
  color: white;
  padding: 2rem;
}
</style>
