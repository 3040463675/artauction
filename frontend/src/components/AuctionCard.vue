<template>
  <el-card class="auction-card" shadow="hover" @click="$emit('click')">
    <div class="card-image">
      <el-image :src="auction.artwork?.imageUrl" fit="cover" />
      <div class="card-badge" v-if="showCountdown">
        <CountdownTimer :endTime="auction.endTime" />
      </div>
    </div>
    <div class="card-content">
      <h3 class="card-title">{{ auction.artwork?.name || '未命名作品' }}</h3>
      <div class="card-price">
        <span class="label">当前价格</span>
        <span class="value">{{ formatPrice(auction.highestBid || auction.startingPrice) }} ETH</span>
      </div>
      <el-tag :type="getStatusType(auction.status)" size="small">
        {{ getStatusText(auction.status) }}
      </el-tag>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const getStatusType = (status: number) => {
  const types: Record<number, string> = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'danger',
    4: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: number) => {
  const texts: Record<number, string> = {
    0: '待开始',
    1: '进行中',
    2: '已结束',
    3: '已取消',
    4: '已结算'
  }
  return texts[status] || '未知'
}
</script>

<style lang="scss" scoped>
.auction-card {
  cursor: pointer;
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-4px);
  }

  .card-image {
    position: relative;
    height: 200px;
    overflow: hidden;

    .el-image {
      width: 100%;
      height: 100%;
    }

    .card-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
    }
  }

  .card-content {
    padding: 16px;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .card-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .label {
        color: #666;
        font-size: 12px;
      }

      .value {
        font-size: 18px;
        font-weight: 600;
        color: #1a1a2e;
      }
    }
  }
}
</style>
