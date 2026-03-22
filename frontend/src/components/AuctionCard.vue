<template>
  <el-card class="auction-card" :class="{ 'is-ended': isEnded }" shadow="hover" @click="$emit('click')">
    <div class="card-image">
      <el-image :src="auction.artwork?.imageUrl" fit="cover" />
      
      <!-- 只有进行中的作品显示毛玻璃倒计时 -->
      <div class="glass-countdown" v-if="!isEnded && showCountdown">
        <el-icon><Timer /></el-icon>
        <CountdownTimer :endTime="auction.endTime" @end="handleEnded" />
      </div>

      <!-- 已结束状态的徽章 -->
      <div class="status-overlay" v-if="isEnded">
        <el-tag type="info" effect="dark" class="ended-tag">已结束</el-tag>
      </div>
    </div>

    <div class="card-content">
      <h3 class="card-title">{{ auction.artwork?.name || '未命名作品' }}</h3>
      
      <div class="card-info-row">
        <div class="price-box">
          <span class="label">起拍价</span>
          <span class="value">{{ formatPrice(auction.startingPrice ?? auction.highestBid ?? '0') }} ETH</span>
        </div>
        
        <div class="status-box">
          <el-tag :type="displayStatus.type" size="small" effect="plain">
            {{ displayStatus.text }}
          </el-tag>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Timer } from '@element-plus/icons-vue'
import CountdownTimer from './CountdownTimer.vue'
import { formatPrice } from '@/utils/format'

interface Props {
  auction: any
  showCountdown?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCountdown: false
})

defineEmits(['click'])

const internalEnded = ref(false)

const isEnded = computed(() => {
  if (internalEnded.value) return true
  if (props.auction.status === 4 || props.auction.status === 2 || props.auction.status === 3) return true
  
  // 检查时间是否已过
  const now = Date.now()
  const endTime = new Date(props.auction.endTime).getTime()
  return now > endTime
})

const handleEnded = () => {
  internalEnded.value = true
}

const displayStatus = computed(() => {
  if (isEnded.value) {
    if (props.auction.status === 3) return { text: '已流拍', type: 'danger' }
    return { text: '已结束', type: 'info' }
  }
  
  const statusMap: Record<number, { text: string, type: string }> = {
    0: { text: '待开始', type: 'warning' },
    1: { text: '进行中', type: 'success' }
  }
  
  return statusMap[props.auction.status] || { text: '进行中', type: 'success' }
})
</script>

<style lang="scss" scoped>
.auction-card {
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  border: none;
  border-radius: 20px;
  overflow: hidden;

  &.is-ended {
    opacity: 0.9;
    .card-image {
      filter: grayscale(0.2);
    }
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    
    .card-image .el-image {
      transform: scale(1.05);
    }
  }

  .card-image {
    position: relative;
    height: 220px;
    overflow: hidden;

    .el-image {
      width: 100%;
      height: 100%;
      transition: transform 0.6s ease;
    }

    .glass-countdown {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      padding: 8px 15px;
      border-radius: 12px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      z-index: 2;

      .el-icon {
        font-size: 16px;
      }
    }

    .status-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;

      .ended-tag {
        padding: 8px 20px;
        font-size: 14px;
        font-weight: 700;
        border-radius: 30px;
        letter-spacing: 1px;
      }
    }
  }

  .card-content {
    padding: 20px;

    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 15px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;

      .price-box {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .label {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 500;
        }

        .value {
          font-size: 20px;
          font-weight: 800;
          color: #3b82f6;
        }
      }

      .status-box {
        :deep(.el-tag) {
          border-radius: 8px;
          font-weight: 600;
          padding: 0 10px;
        }
      }
    }
  }
}
</style>
