<template>
  <div class="artwork-audit">
    <div class="page-header">
      <div class="header-left">
        <h2>作品审核中心</h2>
        <p class="subtitle">严格把关平台作品内容，确保艺术品质量与合规性</p>
      </div>
      <div class="header-right">
        <el-radio-group v-model="filterStatus" size="large" @change="handleFilterChange">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="pending">待审核</el-radio-button>
          <el-radio-button value="verified">可拍卖</el-radio-button>
          <el-radio-button value="rejected">被驳回</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="filteredList" v-loading="loading" style="width: 100%" border stripe>
        <el-table-column label="作品预览" width="120" align="center">
          <template #default="{ row }">
            <el-image 
              :src="row.imageUrl" 
              class="artwork-thumb" 
              fit="cover"
              :preview-src-list="[row.imageUrl]"
              preview-teleported
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="作品名称" min-width="150" show-overflow-tooltip />
        
        <el-table-column label="发布者" min-width="150">
          <template #default="{ row }">
            <div class="creator-info">
              <el-avatar :size="24" :src="row.creator?.avatar" />
              <span class="username">{{ getPublisherDisplay(row) }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="tokenId" label="Token ID" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">#{{ row.tokenId }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">可拍卖</el-tag>
            <el-tag v-else-if="row.status === 3" type="danger">已驳回</el-tag>
            <el-tag v-else-if="row.status === 4" type="info" effect="dark">已终止</el-tag>
            <el-tag v-else type="warning">待审核</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="发布时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button 
                type="success" 
                size="small" 
                @click="handleVerify(row, true)"
              >
                通过审核
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                plain
                @click="handleRejectDialog(row)"
              >
                驳回
              </el-button>
            </template>
            <el-button 
              v-else-if="row.status === 1"
              type="info" 
              size="small" 
              plain
              disabled
            >
              已通过
            </el-button>
            <el-button 
              v-else-if="row.status === 3"
              type="info" 
              size="small" 
              plain
              disabled
            >
              已驳回
            </el-button>
            <el-button 
              type="info" 
              size="small" 
              link
              @click="viewDetail(row)"
            >
              详情
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

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="作品审核详情"
      width="600px"
      destroy-on-close
    >
      <div v-if="selectedArtwork" class="artwork-detail">
        <div class="detail-image">
          <el-image :src="selectedArtwork.imageUrl" fit="contain" />
        </div>
        <div class="detail-info">
          <div class="info-item">
            <span class="label">作品名称：</span>
            <span class="value">{{ selectedArtwork.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">Token ID：</span>
            <span class="value">#{{ selectedArtwork.tokenId }}</span>
          </div>
          <div class="info-item">
            <span class="label">作品描述：</span>
            <span class="value">{{ selectedArtwork.description }}</span>
          </div>
          <div class="info-item">
            <span class="label">发布者地址：</span>
            <span class="value font-mono">{{ selectedArtwork.ownerAddress }}</span>
          </div>
          <div class="info-item">
            <span class="label">起拍价格：</span>
            <span class="value price">{{ selectedArtwork.metadata?.startingPrice || '0.1' }} ETH</span>
          </div>
          <div class="info-item">
            <span class="label">最低加价：</span>
            <span class="value price">{{ selectedArtwork.metadata?.minIncrement || '0.01' }} ETH</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button 
            v-if="!selectedArtwork?.isVerified" 
            type="primary" 
            @click="handleVerify(selectedArtwork)"
          >
            通过审核
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 驳回理由对话框 -->
    <el-dialog
      v-model="rejectVisible"
      title="填写驳回理由"
      width="400px"
    >
      <el-form :model="rejectForm">
        <el-form-item label="驳回原因">
          <el-input 
            v-model="rejectForm.reason" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入驳回该作品的具体原因，用户修改时可见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="rejectVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmReject">确定驳回</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getArtworks, verifyArtwork, rejectArtwork } from '@/api/artwork'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const filterStatus = ref('all')
const detailVisible = ref(false)
const rejectVisible = ref(false)
const selectedArtwork = ref<any>(null)
const rejectForm = reactive({
  id: 0,
  reason: ''
})

const queryParams = reactive({
  page: 1,
  pageSize: 10
})

// 过滤后的列表
const filteredList = computed(() => {
  if (filterStatus.value === 'pending') {
    return list.value.filter(item => item.status === 0)
  }
  if (filterStatus.value === 'verified') {
    return list.value.filter(item => item.status === 1)
  }
  if (filterStatus.value === 'rejected') {
    return list.value.filter(item => item.status === 3)
  }
  return list.value
})

const handleFilterChange = () => {
  queryParams.page = 1
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getArtworks(queryParams)
    // 兼容后端可能返回的 0 或 200 成功码
    if (res.code === 0 || res.code === 200) {
      list.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    console.error('Fetch error:', error)
    ElMessage.error('获取作品列表失败')
  } finally {
    loading.value = false
  }
}

// 审核通过/撤回
const handleVerify = async (row: any, status: boolean = true) => {
  const actionText = status ? '通过' : '撤回'
  try {
    await ElMessageBox.confirm(
      `确定要${actionText}该作品的审核吗？${status ? '通过后作品将对全站可见。' : '撤回后作品将转为待审核状态并从前台隐藏。'}`, 
      '操作确认', 
      {
        confirmButtonText: `确定${actionText}`,
        cancelButtonText: '取消',
        type: status ? 'success' : 'warning'
      }
    )
    
    const res = await verifyArtwork(row.id, status)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success(`${actionText}成功`)
      detailVisible.value = false
      fetchData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 打开驳回弹窗
const handleRejectDialog = (row: any) => {
  rejectForm.id = row.id
  rejectForm.reason = ''
  rejectVisible.value = true
}

// 确认驳回
const confirmReject = async () => {
  if (!rejectForm.reason.trim()) {
    return ElMessage.warning('请输入驳回理由')
  }

  try {
    const res = await rejectArtwork(rejectForm.id, rejectForm.reason)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('作品已驳回')
      rejectVisible.value = false
      fetchData()
    }
  } catch (error) {
    ElMessage.error('驳回操作失败')
  }
}

const viewDetail = (row: any) => {
  selectedArtwork.value = row
  detailVisible.value = true
}

const getPublisherDisplay = (row: any) => {
  return row.ownerAddress || row.creator?.address || row.creator?.username || '未知用户'
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.artwork-audit {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    h2 { font-size: 24px; color: #1e293b; margin: 0 0 4px 0; }
    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
  }

  .table-card {
    border: none; border-radius: 12px;
    .artwork-thumb { width: 80px; height: 80px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; }
    .image-placeholder { width: 100%; height: 100%; background: #f5f7fa; display: flex; align-items: center; justify-content: center; color: #909399; font-size: 24px; }
    .creator-info { display: flex; align-items: center; gap: 8px; .username { font-size: 14px; color: #606266; } }
    .pagination-container { margin-top: 24px; display: flex; justify-content: flex-end; }
  }

  .artwork-detail {
    .detail-image { width: 100%; max-height: 300px; margin-bottom: 20px; border-radius: 8px; overflow: hidden; background: #f5f7fa; display: flex; justify-content: center; .el-image { max-width: 100%; max-height: 100%; } }
    .detail-info { 
      .info-item { 
        margin-bottom: 12px; display: flex; 
        .label { width: 100px; color: #94a3b8; flex-shrink: 0; } 
        .value { color: #1e293b; line-height: 1.6; word-break: break-all; } 
        .price { color: #f56c6c; font-weight: 700; font-size: 16px; }
        .font-mono { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; } 
      } 
    }
  }
}
</style>
