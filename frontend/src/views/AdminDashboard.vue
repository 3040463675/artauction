<template>
  <div class="admin-dashboard">
    <!-- 数据统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="(item, index) in stats" :key="index">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <span class="stat-label">{{ item.label }}</span>
              <div class="stat-value">
                <span v-if="item.isPrice" class="unit">ETH</span>
                {{ item.value }}
              </div>
            </div>
            <div class="stat-icon" :style="{ background: item.color }">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
          </div>
          <div class="stat-footer">
            <span class="trend" :class="item.trend > 0 ? 'up' : 'down'">
              {{ item.trend > 0 ? '+' : '' }}{{ item.trend }}%
            </span>
            <span class="foot-label">较昨日</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card shadow="hover" class="main-chart-card">
          <template #header>
            <div class="card-header">
              <span class="title">交易趋势</span>
              <el-radio-group v-model="timeRange" size="small">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-placeholder">
            <!-- 实际项目中可集成 ECharts -->
            <div class="mock-chart">
              <div v-for="h in 12" :key="h" class="bar" :style="{ height: Math.random() * 150 + 50 + 'px' }"></div>
            </div>
            <p class="chart-tip">交易额趋势统计图 (ECharts 集成位)</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card shadow="hover" class="recent-audit-card">
          <template #header>
            <div class="card-header">
              <span class="title">待审核作品</span>
              <el-button link type="primary" @click="$router.push('/admin/artworks')">全部</el-button>
            </div>
          </template>
          <div class="audit-list">
            <div v-for="i in 5" :key="i" class="audit-item">
              <el-avatar shape="square" :size="40" src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100" />
              <div class="item-info">
                <span class="name">数字艺术品 #{{ 100 + i }}</span>
                <span class="time">10 分钟前发布</span>
              </div>
              <el-button size="small" plain type="success">审核</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  User, 
  Picture, 
  Wallet, 
  TrendCharts 
} from '@element-plus/icons-vue'

const timeRange = ref('week')

const stats = [
  { label: '总用户数', value: '1,284', icon: User, color: '#409eff', trend: 12 },
  { label: '艺术品总量', value: '3,592', icon: Picture, color: '#67c23a', trend: 8 },
  { label: '成交总额', value: '158.42', isPrice: true, icon: Wallet, color: '#e6a23c', trend: 24 },
  { label: '活跃拍卖', value: '42', icon: TrendCharts, color: '#f56c6c', trend: -5 }
]
</script>

<style lang="scss" scoped>
.admin-dashboard {
  .stat-card {
    border: none;
    border-radius: 12px;
    
    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .stat-info {
        .stat-label {
          font-size: 14px;
          color: #94a3b8;
          display: block;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #1e293b;
          .unit {
            font-size: 14px;
            font-weight: 600;
            margin-right: 2px;
          }
        }
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 24px;
      }
    }

    .stat-footer {
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;

      .trend {
        font-weight: 700;
        &.up { color: #67c23a; }
        &.down { color: #f56c6c; }
      }
      .foot-label {
        color: #94a3b8;
      }
    }
  }

  .chart-row {
    margin-top: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title {
      font-weight: 700;
      color: #1e293b;
    }
  }

  .main-chart-card {
    height: 400px;
    border: none;
    border-radius: 12px;

    .chart-placeholder {
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      border-radius: 8px;

      .mock-chart {
        display: flex;
        align-items: flex-end;
        gap: 15px;
        height: 200px;
        margin-bottom: 20px;

        .bar {
          width: 30px;
          background: linear-gradient(to top, #409eff, #79bbff);
          border-radius: 4px 4px 0 0;
          transition: height 0.3s;
        }
      }
      .chart-tip {
        color: #94a3b8;
        font-size: 13px;
      }
    }
  }

  .recent-audit-card {
    height: 400px;
    border: none;
    border-radius: 12px;

    .audit-list {
      .audit-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f1f5f9;

        &:last-child { border-bottom: none; }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          .name {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          .time {
            font-size: 12px;
            color: #94a3b8;
          }
        }
      }
    }
  }
}
</style>
