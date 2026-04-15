<template>
  <div class="settings-page">
    <div class="container">
      <div class="page-header">
        <h1>账户设置</h1>
        <p class="subtitle">管理您的个人资料、通知偏好与安全选项</p>
      </div>

      <div class="settings-layout">
        <!-- 左侧菜单 -->
        <div class="settings-sidebar">
          <el-menu
            :default-active="activeMenu"
            class="settings-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="profile">
              <el-icon><User /></el-icon>
              <span>个人资料</span>
            </el-menu-item>
            <el-menu-item index="account">
              <el-icon><Lock /></el-icon>
              <span>账户安全</span>
            </el-menu-item>
            <el-menu-item index="notifications">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </el-menu-item>
          </el-menu>
        </div>

        <!-- 右侧内容区 -->
        <div class="settings-content">
          <el-card shadow="never" class="content-card">
            <!-- 个人资料设置 -->
            <div v-if="activeMenu === 'profile'" class="settings-section">
              <h3 class="section-title">个人资料</h3>
              <el-form :model="profileForm" label-position="top">
                <el-form-item label="头像">
                  <div class="avatar-upload">
                    <el-avatar :size="80" :src="profileForm.avatar">
                      <el-icon :size="40"><User /></el-icon>
                    </el-avatar>
                    <input
                      type="file"
                      ref="fileInput"
                      style="display: none"
                      accept="image/*"
                      @change="handleFileChange"
                    />
                    <el-button type="primary" plain size="small" @click="triggerUpload">更换头像</el-button>
                  </div>
                </el-form-item>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="昵称">
                      <el-input v-model="profileForm.nickname" placeholder="请输入您的昵称" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="邮箱地址">
                      <el-input v-model="profileForm.email" placeholder="example@artchain.com" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="个人简介">
                  <el-input
                    v-model="profileForm.bio"
                    type="textarea"
                    :rows="4"
                    placeholder="介绍一下你自己..."
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="saveProfile">保存更改</el-button>
                </el-form-item>
              </el-form>
            </div>

            <!-- 账户安全 -->
            <div v-if="activeMenu === 'account'" class="settings-section">
              <h3 class="section-title">账户安全</h3>
              <div class="security-item">
                <div class="item-info">
                  <div class="item-title">钱包地址</div>
                  <div class="item-desc">{{ userStore.address }}</div>
                </div>
                <el-tag type="success" size="small">已连接</el-tag>
              </div>
              <el-divider />
              <div class="security-item">
                <div class="item-info">
                  <div class="item-title">身份验证</div>
                  <div class="item-desc">启用两步验证以提高账户安全性</div>
                </div>
                <el-switch v-model="securityForm.twoFactor" />
              </div>
            </div>

            <!-- 通知设置 -->
            <div v-if="activeMenu === 'notifications'" class="settings-section">
              <h3 class="section-title">通知设置</h3>
              <div class="notification-item">
                <div class="item-info">
                  <div class="item-title">出价提醒</div>
                  <div class="item-desc">当有人超过您的出价时发送通知</div>
                </div>
                <el-switch v-model="notifyForm.bidOutbid" />
              </div>
              <el-divider />
              <div class="notification-item">
                <div class="item-info">
                  <div class="item-title">拍卖结束提醒</div>
                  <div class="item-desc">在您关注或参与的拍卖结束前发送提醒</div>
                </div>
                <el-switch v-model="notifyForm.auctionEnding" />
              </div>
              <el-divider />
              <div class="notification-item">
                <div class="item-info">
                  <div class="item-title">系统更新</div>
                  <div class="item-desc">接收来自 ArtChain 的功能更新与重要通知</div>
                </div>
                <el-switch v-model="notifyForm.systemUpdate" />
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { User, Lock, Bell } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { request } from '@/api/request'

const userStore = useUserStore()
const activeMenu = ref('profile')
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const profileForm = reactive({
  nickname: '',
  email: '',
  bio: '',
  avatar: ''
})

onMounted(() => {
  // 初始化表单数据
  if (userStore.userInfo) {
    profileForm.nickname = userStore.userInfo.username || ''
    profileForm.email = userStore.userInfo.email || ''
    profileForm.bio = userStore.userInfo.bio || ''
    profileForm.avatar = userStore.userInfo.avatar || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200'
  }
})

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过 2MB')
      return
    }
    
    // 调用后端上传接口
    try {
      uploading.value = true
      const formData = new FormData()
      formData.append('file', file)
      
      const res: any = await request.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (res.code === 0 || res.code === 200) {
        profileForm.avatar = res.data.url
        ElMessage.success('头像上传成功')
      }
    } catch (err) {
      ElMessage.error('头像上传失败')
    } finally {
      uploading.value = false
    }
  }
}

const securityForm = reactive({
  twoFactor: false
})

const notifyForm = reactive({
  bidOutbid: true,
  auctionEnding: true,
  systemUpdate: false
})

const handleMenuSelect = (index: string) => {
  activeMenu.value = index
}

const saveProfile = async () => {
  try {
    const res: any = await request.put('/user/info', {
      username: profileForm.nickname,
      email: profileForm.email,
      bio: profileForm.bio,
      avatar: profileForm.avatar
    })

    if (res.code === 0 || res.code === 200) {
      // 更新全局状态
      userStore.setUserInfo(res.data)
      ElMessage.success('个人资料已成功更新并存储到数据库')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '更新失败')
  }
}
</script>

<style lang="scss" scoped>
.settings-page {
  padding: 40px 0;
  min-height: calc(100vh - 64px - 72px);
  background: #f8fafc;

  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 20px;
  }
}

.page-header {
  margin-bottom: 32px;
  h1 {
    margin: 0 0 8px 0;
    font-size: 32px;
    font-weight: 800;
    color: #1a1a2e;
  }
  .subtitle {
    margin: 0;
    color: #64748b;
    font-size: 16px;
  }
}

.settings-layout {
  display: flex;
  gap: 32px;

  .settings-sidebar {
    width: 240px;
    flex-shrink: 0;

    .settings-menu {
      border: none;
      background: transparent;
      
      .el-menu-item {
        border-radius: 12px;
        margin-bottom: 4px;
        color: #64748b;
        font-weight: 500;
        height: 50px;
        
        &:hover {
          background-color: #f1f5f9;
        }
        
        &.is-active {
          background-color: #fff;
          color: #3b82f6;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          font-weight: 600;
        }
        
        .el-icon {
          font-size: 18px;
        }
      }
    }
  }

  .settings-content {
    flex: 1;

    .content-card {
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      padding: 10px;
    }
  }
}

.settings-section {
  .section-title {
    margin: 0 0 24px 0;
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
  }
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 20px;
}

.security-item, .notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;

  .item-info {
    .item-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .item-desc {
      font-size: 14px;
      color: #64748b;
      font-family: inherit;
    }
  }
}

@media (max-width: 768px) {
  .settings-layout {
    flex-direction: column;
    
    .settings-sidebar {
      width: 100%;
    }
  }
}
</style>
