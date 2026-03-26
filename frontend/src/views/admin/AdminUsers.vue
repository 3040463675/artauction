<template>
  <div class="admin-users">
    <div class="page-header">
      <div class="header-left">
        <h2>用户管理</h2>
        <p class="subtitle">查看平台用户信息并执行封禁或解封操作</p>
      </div>
      <div class="header-right">
        <el-form :inline="true" :model="query" class="search-form">
          <el-form-item>
            <el-input v-model="query.keyword" placeholder="搜索地址/昵称" clearable @keyup.enter="fetchList" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchList">查询</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="list" v-loading="loading" border stripe>
        <el-table-column label="用户名" min-width="160">
          <template #default="{ row }">{{ row.username || '-' }}</template>
        </el-table-column>
        <el-table-column label="钱包地址" min-width="300">
          <template #default="{ row }">
            <span class="addr">{{ row.address || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="ETH余额" width="160" align="center">
          <template #default="{ row }">{{ formatBalance(row.balance) }}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="220" align="center">
          <template #default="{ row }">{{ formatLocalTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                plain
                size="small"
                :disabled="row.enabled"
                @click="updateStatus(row, true)"
              >
                解封
              </el-button>
              <el-button
                type="danger"
                size="small"
                :disabled="!row.enabled"
                @click="updateStatus(row, false)"
              >
                封禁
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>
  </div>
  </template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, updateUserStatus } from '@/api/user'

type UserItem = {
  id: number
  username: string | null
  address: string
  balance: string | number | null
  createdAt: string
  enabled: boolean
}

const loading = ref(false)
const list = ref<UserItem[]>([])
const total = ref(0)
const query = reactive({
  page: 1,
  pageSize: 10,
  keyword: ''
})

const formatLocalTime = (val: string | number) => {
  if (!val) return '-'
  const date = new Date(val)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', { hour12: false })
}

const formatBalance = (val: string | number | null | undefined) => {
  if (val === null || val === undefined || val === '') return '-'
  const num = Number(val)
  if (Number.isNaN(num)) return '-'
  return `${num.toFixed(4)} ETH`
}

const fetchList = async () => {
  loading.value = true
  try {
    const res: any = await getUsers({
      page: query.page,
      pageSize: query.pageSize,
      keyword: query.keyword
    })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '加载用户失败')
  } finally {
    loading.value = false
  }
}

const updateStatus = async (row: UserItem, nextEnabled: boolean) => {
  const actionText = nextEnabled ? '解封' : '封禁'
  try {
    await ElMessageBox.confirm(`确认${actionText}该用户？`, `${actionText}确认`, {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }

  try {
    await updateUserStatus(row.id, nextEnabled)
    row.enabled = nextEnabled
    ElMessage.success(`${actionText}成功`)
  } catch (e: any) {
    ElMessage.error(e?.message || `${actionText}失败`)
  }
}

onMounted(() => fetchList())
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .header-left {
    h2 { margin: 0; font-size: 22px; }
    .subtitle { margin: 4px 0 0; color: #64748b; font-size: 13px; }
  }
}

.addr {
  font-family: monospace;
  font-size: 12px;
  color: #334155;
}
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.pagination { margin-top: 12px; text-align: right; }
</style>
