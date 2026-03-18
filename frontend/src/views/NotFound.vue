<template>
  <div class="not-found-page">
    <div class="container">
      <div class="content">
        <h1>404</h1>
        <p>页面不存在</p>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404页面
</script>

<style lang="scss" scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 64px - 72px);

  .content {
    text-align: center;

    h1 {
      font-size: 120px;
      font-weight: 600;
      color: #667eea;
      margin-bottom: 16px;
      line-height: 1;
    }

    p {
      font-size: 24px;
      color: #666;
      margin-bottom: 32px;
    }
  }
}
</style>
