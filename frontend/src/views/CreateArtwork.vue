<template>
  <div class="create-artwork-page">
    <div class="container">
      <div class="page-header">
        <h1>发布艺术品</h1>
        <p>提交作品审核，审核通过后可上架拍卖</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="create-form"
      >
        <el-row :gutter="32">
          <!-- 左侧：基本信息 -->
          <el-col :xs="24" :md="16">
            <!-- 驳回理由提示框 (仅在编辑被驳回作品时显示) -->
            <el-alert
              v-if="isEdit && artworkStatus === 3"
              title="作品已被驳回"
              type="danger"
              class="rejection-alert"
              :closable="false"
              show-icon
            >
              <div class="rejection-reason-content">
                <strong>驳回理由：</strong>
                <p>{{ auditReason || '未填写具体原因' }}</p>
              </div>
            </el-alert>

            <el-card class="form-card">
              <template #header>
                <span>基本信息</span>
              </template>

              <el-form-item label="艺术品名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入艺术品名称" maxlength="100" show-word-limit />
              </el-form-item>

              <el-form-item label="艺术品描述" prop="description">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  :rows="4"
                  placeholder="请详细描述您的艺术品"
                  maxlength="2000"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="分类" prop="categoryId">
                <el-select v-model="form.categoryId" placeholder="请选择分类">
                  <el-option
                    v-for="category in categories"
                    :key="category.id"
                    :label="category.name"
                    :value="category.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="艺术品图片" prop="imageUrl">
                <el-upload
                  class="image-uploader"
                  :action="uploadUrl"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :on-success="handleUploadSuccess"
                  :before-upload="beforeUpload"
                  accept="image/*"
                >
                  <el-image v-if="form.imageUrl" :src="form.imageUrl" fit="contain" class="preview-image" />
                  <div v-else class="upload-placeholder">
                    <el-icon :size="48"><Plus /></el-icon>
                    <span>点击上传图片</span>
                  </div>
                </el-upload>
                <div class="upload-tip">支持 JPG、PNG、GIF 格式，最大 10MB</div>
              </el-form-item>
            </el-card>

            <el-card class="form-card">
              <template #header>
                <span>拍卖参数</span>
              </template>
              <el-row :gutter="16">
                <el-col :span="12">
                  <el-form-item label="起拍价 (ETH)" prop="startingPrice">
                    <el-input-number
                      v-model="form.startingPrice"
                      :min="0.001"
                      :precision="4"
                      :step="0.01"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="最低加价 (ETH)" prop="minIncrement">
                    <el-input-number
                      v-model="form.minIncrement"
                      :min="0.001"
                      :precision="4"
                      :step="0.01"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-card>

          </el-col>

          <!-- 右侧：预览和提交 -->
          <el-col :xs="24" :md="8">
            <el-card class="preview-card">
              <template #header>
                <span>预览</span>
              </template>

              <div class="preview-content">
                <el-image
                  v-if="form.imageUrl"
                  :src="form.imageUrl"
                  fit="contain"
                  class="preview-image"
                />
                <div v-else class="preview-placeholder">
                  <el-icon :size="48"><Picture /></el-icon>
                </div>

                <h3>{{ form.name || '艺术品名称' }}</h3>
                <p>{{ form.description || '艺术品描述...' }}</p>

                <div class="preview-price">
                  <span class="label">起拍价</span>
                  <span class="value">{{ form.startingPrice }} ETH</span>
                </div>
                <div class="preview-price">
                  <span class="label">最低加价</span>
                  <span class="value">{{ form.minIncrement }} ETH</span>
                </div>
              </div>

              <el-button
                type="primary"
                size="large"
                class="submit-button"
                :loading="submitting"
                @click="handleSubmit"
              >
                提交审核
              </el-button>
            </el-card>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { createArtwork as apiCreateArtwork, getArtworkById, updateArtwork } from '@/api/artwork'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const isEdit = ref(false)
const artworkId = ref<number | null>(null)
const artworkStatus = ref<number | null>(null) // 新增：作品状态
const auditReason = ref<string | null>(null) // 新增：驳回理由

const form = reactive({
  name: '',
  description: '',
  categoryId: null as number | null,
  imageUrl: '',
  ipfsHash: '',
  startingPrice: 0.1,
  minIncrement: 0.01
})

onMounted(async () => {
  const id = route.query.id
  if (id) {
    isEdit.value = true
    artworkId.value = Number(id)
    loadingArtwork(Number(id))
  }
})

const loadingArtwork = async (id: number) => {
  try {
    const res = await getArtworkById(id)
    if (res.code === 0 || res.code === 200) {
      const data = res.data
      form.name = data.name
      form.description = data.description
      form.categoryId = data.categoryId
      form.imageUrl = data.imageUrl
      form.ipfsHash = data.ipfsHash || ''
      artworkStatus.value = data.status // 存储作品状态
      auditReason.value = data.auditReason // 存储驳回理由
      
      // 提取拍卖参数
      if (data.metadata) {
        form.startingPrice = Number(data.metadata.startingPrice) || 0.1
        form.minIncrement = Number(data.metadata.minIncrement) || 0.01
      }
    }
  } catch (error) {
    ElMessage.error('获取作品信息失败')
  }
}

const rules: FormRules = {
  name: [
    { required: true, message: '请输入艺术品名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入艺术品描述', trigger: 'blur' }
  ],
  imageUrl: [
    { required: true, message: '请上传艺术品图片', trigger: 'change' }
  ],
  startingPrice: [
    { required: true, message: '请输入起拍价', trigger: 'blur' }
  ],
  minIncrement: [
    { required: true, message: '请输入最低加价', trigger: 'blur' }
  ]
}

const categories = ref([
  { id: 1, name: '油画' },
  { id: 2, name: '水彩' },
  { id: 3, name: '版画' },
  { id: 4, name: '雕塑' },
  { id: 5, name: '摄影' },
  { id: 6, name: '数字艺术' },
  { id: 7, name: '书法' },
  { id: 8, name: '其他' }
])

const uploadUrl = computed(() => {
  return import.meta.env.VITE_API_BASE_URL + '/upload/image'
})

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response: any) => {
  if (response.code === 0 || response.code === 200) {
    form.imageUrl = response.data.url
    form.ipfsHash = response.data.ipfsHash || ''
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (!userStore.isConnected) {
      ElMessage.warning('请先连接钱包')
      return
    }

    try {
      submitting.value = true

      // 1. 移除区块链铸造逻辑，直接提交审核
      // 提交作品不再需要唤醒 MetaMask 付钱
      let tokenId: any = 0
      if (!isEdit.value) {
        // 对于新提交的作品，生成一个临时的随机 Token ID 用于标识
        // 真正的铸造可以放在管理员审核通过后或用户上架时（根据业务需求）
        tokenId = Math.floor(Math.random() * 1000000)
      }

      // 2. 同步艺术品到数据库
      const artworkData = {
        tokenId: Number(tokenId),
        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl,
        ipfsHash: form.ipfsHash,
        categoryId: form.categoryId || 1,
        ownerAddress: userStore.address,
        metadata: {
          startingPrice: form.startingPrice,
          minIncrement: form.minIncrement
        }
      }

      let artworkRes
      if (isEdit.value && artworkId.value) {
        artworkRes = await updateArtwork(artworkId.value, artworkData)
      } else {
        artworkRes = await apiCreateArtwork(artworkData)
      }

      if (artworkRes.code !== 0 && artworkRes.code !== 200) {
        throw new Error(artworkRes.message || '操作失败')
      }

      ElMessage.success(isEdit.value ? '修改成功！已重新提交审核。' : '发布成功！作品已提交审核，审核通过后将正式上架。')
      router.push('/profile')
    } catch (error: any) {
      console.error('Submit failed:', error)
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.create-artwork-page {
  padding: 24px 0;
  min-height: calc(100vh - 64px - 72px);

  .page-header {
    margin-bottom: 32px;

    h1 {
      font-size: 28px;
      margin-bottom: 8px;
    }

    p {
      color: #666;
    }
  }

  .form-card {
    margin-bottom: 24px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .rejection-alert {
    margin-bottom: 24px;
    border-radius: 12px;
    padding: 16px 20px;

    .rejection-reason-content {
      margin-top: 8px;
      strong {
        font-size: 14px;
        color: #dc2626;
      }
      p {
        margin: 4px 0 0 0;
        font-size: 15px;
        color: #ef4444;
        font-weight: 500;
        line-height: 1.6;
      }
    }
  }

  .image-uploader {
    width: 100%;

    .preview-image {
      width: 100%;
      max-height: 300px;
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 200px;
      background: #f5f7fa;
      border: 2px dashed #dcdfe6;
      border-radius: 8px;
      color: #909399;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #667eea;
        color: #667eea;
      }

      span {
        margin-top: 12px;
      }
    }
  }

  .upload-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
  }

  .preview-card {
    position: sticky;
    top: 88px;

    .preview-content {
      .preview-image {
        width: 100%;
        height: 200px;
        background: #f5f7fa;
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .preview-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 200px;
        background: #f5f7fa;
        border-radius: 8px;
        margin-bottom: 16px;
        color: #c0c4cc;
      }

      h3 {
        font-size: 18px;
        margin-bottom: 8px;
      }

      p {
        color: #666;
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: 16px;
      }

      .preview-price {
        display: flex;
        justify-content: space-between;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 8px;

        .label {
          color: #666;
        }

        .value {
          font-weight: 600;
          color: #1a1a2e;
        }
      }
    }

    .submit-button {
      width: 100%;
      margin-top: 24px;
    }
  }
}
</style>
