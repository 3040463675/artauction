<template>
  <div class="auction-manager">
    <div class="page-header">
      <div class="header-left">
        <h2>拍卖管理中心</h2>
        <p class="subtitle">实时监控全平台竞拍动态，处理违规拍卖及热门推荐</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="filterStatus" size="large">
          <el-radio-button label="active">进行中</el-radio-button>
          <el-radio-button label="all">全部拍卖</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="filteredList" v-loading="loading" style="width: 100%" border stripe>
        <el-table-column label="艺术品" min-width="220">
          <template #default="{ row }">
            <div class="artwork-info">
              <el-image :src="row.artwork?.imageUrl" class="artwork-thumb" fit="cover" />
              <div class="text-info">
                <span class="name">{{ row.artwork?.name }}</span>
                <span class="token-id">#{{ row.artwork?.tokenId }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="当前价 / 起拍价" width="180" align="right">
          <template #default="{ row }">
            <div class="price-display">
              <div class="current">{{ row.currentPrice || row.startPrice }} ETH</div>
              <div class="start">起拍: {{ row.startPrice }} ETH</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="出价次数" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.bidsCount || 0 }} 次</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="热门推荐" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.isHot"
              :loading="row.hotLoading"
              active-color="#ff4949"
              @change="toggleHot(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              plain
              @click="viewBidHistory(row)"
            >
              出价日志
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- 出价记录对话框 -->
    <el-dialog
      v-model="historyVisible"
      :title="`出价日志 - ${selectedAuction?.artwork?.name || ''}`"
      width="700px"
      destroy-on-close
    >
      <el-table :data="bidHistory" v-loading="historyLoading" border stripe>
        <el-table-column label="竞买人地址" min-width="200">
          <template #default="{ row }">
            <code class="address-box">{{ row.bidderAddress }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="出价金额" width="150" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ row.amount }} ETH</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="出价时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAuctions, getBidHistory, toggleHotAuction, deleteAuction } from '@/api/auction'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const filterStatus = ref('active')
const historyVisible = ref(false)
const historyLoading = ref(false)
const bidHistory = ref<any[]>([])
const selectedAuction = ref<any>(null)

const queryParams = reactive({
  page: 1,
  pageSize: 10
})

const filteredList = computed(() => {
  if (filterStatus.value === 'active') {
    return list.value.filter(item => item.status === 1)
  }
  return list.value
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAuctions(queryParams)
    // 兼容后端可能返回的 0 或 200 成功码
    if (res.code === 0 || res.code === 200) {
      list.value = res.data.list.map((item: any) => ({ ...item, hotLoading: false }))
      total.value = res.data.total
    }
  } catch (error) {
    ElMessage.error('获取拍卖列表失败')
  } finally {
    loading.value = false
  }
}

// 切换热门状态
const toggleHot = async (row: any) => {
  row.hotLoading = true
  try {
    const res = await toggleHotAuction(row.id, row.isHot)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success(row.isHot ? '已设为热门作品' : '已取消热门标记')
    }
  } catch (error) {
    row.isHot = !row.isHot
    ElMessage.error('操作失败')
  } finally {
    row.hotLoading = false
  }
}

// 删除拍卖
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该拍卖吗？此操作将导致拍卖记录及出价日志被物理删除，关联作品将变为非拍卖状态。', '严重警告', {
      confirmButtonText: '确定物理删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    const res = await deleteAuction(row.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('物理删除成功')
      fetchData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const viewBidHistory = async (row: any) => {
  selectedAuction.value = row
  historyVisible.value = true
  historyLoading.value = true
  try {
    const res = await getBidHistory(row.id)
    if (res.code === 0 || res.code === 200) {
      bidHistory.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取出价记录失败')
  } finally {
    historyLoading.value = false
  }
}

const getStatusType = (status: number) => {
  const types: any = { 0: 'info', 1: 'success', 2: 'warning', 3: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status: number) => {
  const texts: any = { 0: '待开始', 1: '进行中', 2: '已成交', 3: '已流拍' }
  return texts[status] || '未知'
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.auction-manager {
  .page-header {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;
    h2 { font-size: 24px; color: #1e293b; margin: 0 0 4px 0; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
  }

  .table-card {
    border: none; border-radius: 12px;
    .artwork-info { display: flex; align-items: center; gap: 12px;
      .artwork-thumb { width: 50px; height: 50px; border-radius: 6px; flex-shrink: 0; }
      .text-info { display: flex; flex-direction: column;
        .name { font-weight: 600; color: #1e293b; font-size: 14px; }
        .token-id { font-size: 12px; color: #94a3b8; }
      }
    }
    .price-display {
      .current { font-weight: 700; color: #f56c6c; font-size: 15px; }
      .start { font-size: 12px; color: #94a3b8; }
    }
    .pagination-container { margin-top: 24px; display: flex; justify-content: flex-end; }
  }

  .address-box { font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #409eff; }
  .amount-text { font-weight: 700; color: #1e293b; }
}
</style>
