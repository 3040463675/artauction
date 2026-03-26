<template>
  <div class="dashboard">
    <div class="page-header">
      <div class="header-left">
        <h2>数据概览</h2>
        <p class="subtitle">实时监控平台运行核心指标与交易趋势</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="(item, index) in stats" :key="index">
        <el-card
          shadow="hover"
          class="stat-card"
          :class="{ clickable: !!item.route }"
          :style="{ borderLeft: `4px solid ${item.color}` }"
          @click="handleStatClick(item.route)"
        >
          <div class="stat-content">
            <div class="stat-info">
              <span class="stat-label">{{ item.label }}</span>
              <div class="stat-value">
                <span v-if="item.isPrice" class="unit">ETH</span>
                {{ item.value }}
              </div>
            </div>
            <div class="stat-icon" :style="{ color: item.color }">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
          </div>
          <div class="stat-footer">
            <span class="trend" :class="item.trend > 0 ? 'up' : 'down'">
              {{ item.trend > 0 ? '↑' : '↓' }} {{ Math.abs(item.trend) }}%
            </span>
            <span class="foot-label">较昨日</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表展示 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">交易额增长趋势</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button value="7d">近7天</el-radio-button>
                <el-radio-button value="30d">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="mock-chart-container">
            <div class="bars">
              <div v-for="i in 12" :key="i" class="bar-wrapper">
                <div class="bar" :style="{ height: Math.random() * 150 + 50 + 'px' }"></div>
                <span class="label">{{ 12-i+1 }}月</span>
              </div>
            </div>
            <p class="chart-tip">系统成交总额走势统计 (ECharts 集成位)</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card shadow="hover" class="status-card">
          <template #header>
            <div class="card-header">
              <span class="title">系统运行状态</span>
            </div>
          </template>
          <div class="status-list">
            <div class="status-item">
              <span class="label">后端服务</span>
              <el-tag type="success" size="small">正常</el-tag>
            </div>
            <div class="status-item">
              <span class="label">数据库连接</span>
              <el-tag type="success" size="small">正常</el-tag>
            </div>
            <div class="status-item">
              <span class="label">区块链节点</span>
              <el-tag type="warning" size="small">延迟较高</el-tag>
            </div>
            <div class="status-item">
              <span class="label">IPFS 存储</span>
              <el-tag type="success" size="small">正常</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  User,
  Picture,
  Wallet,
  TrendCharts
} from '@element-plus/icons-vue'
import { getArtworks } from '@/api/artwork'
import { getUsers } from '@/api/user'

const timeRange = ref('7d')
const artworkTotal = ref('0')
const userTotal = ref('0')
let pollTimer: ReturnType<typeof setInterval> | null = null
const router = useRouter()

const formatCount = (value: number) => value.toLocaleString('zh-CN')

const fetchUserTotal = async () => {
  try {
    const res: any = await getUsers({ page: 1, pageSize: 1 })
    if (res.code === 0 || res.code === 200) {
      const total = Number(res.data?.total ?? 0)
      userTotal.value = formatCount(Number.isNaN(total) ? 0 : total)
    }
  } catch (error) {
    console.error('获取用户总量失败:', error)
  }
}

const fetchArtworkTotal = async () => {
  try {
    const res = await getArtworks({ page: 1, pageSize: 1 })
    if (res.code === 0 || res.code === 200) {
      artworkTotal.value = String(res.data?.total ?? 0)
    }
  } catch (error) {
    console.error('获取作品总量失败:', error)
  }
}

const handleStatClick = (route?: string) => {
  if (!route) return
  router.push(route)
}

const refreshStats = () => {
  fetchArtworkTotal()
  fetchUserTotal()
}

const stats = computed(() => [
  { label: '注册用户', value: userTotal.value, icon: User, color: '#409eff', trend: 12, route: '/admin/users' },
  { label: '作品总量', value: artworkTotal.value, icon: Picture, color: '#67c23a', trend: 8, route: '/admin/audit' },
  { label: '成交总额', value: '158.42', isPrice: true, icon: Wallet, color: '#e6a23c', trend: 24 },
  { label: '活跃拍卖', value: '42', icon: TrendCharts, color: '#f56c6c', trend: -5 }
])

onMounted(() => {
  refreshStats()
  pollTimer = setInterval(refreshStats, 10000)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<style lang="scss" scoped>
.dashboard {
  .page-header {
    margin-bottom: 24px;
    h2 { font-size: 24px; color: #1e293b; margin: 0 0 4px 0; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
  }

  .stats-row {
    margin-bottom: 24px;
    .stat-card {
      border: none;
      border-radius: 12px;
      &.clickable {
        cursor: pointer;
      }
      .stat-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        .stat-label { font-size: 14px; color: #64748b; display: block; margin-bottom: 4px; }
        .stat-value { font-size: 24px; font-weight: 800; color: #1e293b; 
          .unit { font-size: 14px; font-weight: 600; margin-right: 2px; }
        }
        .stat-icon { font-size: 28px; }
      }
      .stat-footer {
        font-size: 12px; display: flex; align-items: center; gap: 6px;
        .trend { font-weight: 700; &.up { color: #67c23a; } &.down { color: #f56c6c; } }
        .foot-label { color: #94a3b8; }
      }
    }
  }

  .chart-row {
    .chart-card {
      border: none; border-radius: 12px;
      .card-header { display: flex; justify-content: space-between; align-items: center; 
        .title { font-weight: 700; color: #1e293b; }
      }
      .mock-chart-container {
        height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: #f8fafc; border-radius: 8px; margin-top: 10px;
        .bars { display: flex; align-items: flex-end; gap: 15px; height: 200px; margin-bottom: 20px;
          .bar-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px;
            .bar { width: 24px; background: linear-gradient(to top, #409eff, #79bbff); border-radius: 4px 4px 0 0; }
            .label { font-size: 12px; color: #94a3b8; }
          }
        }
        .chart-tip { color: #94a3b8; font-size: 13px; }
      }
    }
    .status-card {
      border: none; border-radius: 12px;
      .card-header { .title { font-weight: 700; color: #1e293b; } }
      .status-list { display: flex; flex-direction: column; gap: 16px; padding: 10px 0;
        .status-item { display: flex; justify-content: space-between; align-items: center;
          .label { font-size: 14px; color: #1e293b; }
        }
      }
    }
  }
}
</style>
