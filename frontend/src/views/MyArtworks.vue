<template>
  <div class="my-artworks-page">
    <div class="container">
      <h1>我的作品</h1>
      <el-empty description="暂无作品">
        <el-button type="primary" @click="goToCreate">添加作品</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToCreate = () => {
  router.push({ name: 'CreateArtwork' })
}
</script>

<style lang="scss" scoped>
.my-artworks-page {
  padding: 24px 0;
  min-height: calc(100vh - 64px - 72px);
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 100px 0;
}
</style>
