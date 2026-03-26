<template>
  <div class="login-landing">
    <div class="container">
      <div class="left brand" :class="{ 'fade-up': animatedIn }">
        <div class="brand-mark">ArtChain</div>
        <div class="subtitle">BLOCKCHAIN ART AUCTION</div>
        <div class="frame-decor"></div>
      </div>
      <div class="right panel">
        <div class="tabs">
          <button class="tab" :class="{ active: activeTab==='user' }" @click="activeTab='user'">用户登录</button>
          <button class="tab" :class="{ active: activeTab==='admin' }" @click="activeTab='admin'">管理员登录</button>
        </div>

        <el-card v-if="activeTab==='user'" class="card user-card fade-up" shadow="always">
          <div class="user-title">欢迎回来</div>
          <p class="user-tip">登录您的账户，参与艺术品竞拍</p>
          <div class="wallet-state" v-if="connectState === 'connected'">
            <el-tag type="success" effect="light">已连接</el-tag>
            <code class="addr">{{ truncatedAddress }}</code>
          </div>
          <template v-if="connectState !== 'connected'">
            <el-button
              class="action-btn gold"
              size="large"
              :loading="connectState === 'loading'"
              @click="handleConnect"
            >
              <el-icon><Wallet /></el-icon>
              <span v-if="connectState === 'idle'">连接 MetaMask</span>
              <span v-else>连接中...</span>
            </el-button>
          </template>
          <template v-else>
            <el-button
              class="action-btn gold"
              type="primary"
              size="large"
              @click="goBuyerHome"
            >
              进入系统
            </el-button>
          </template>
          <el-checkbox v-model="rememberUser" class="remember">记住登录状态</el-checkbox>
        </el-card>

        <el-card v-else class="card admin-card fade-up" shadow="always" :class="{ shake: shakeCard }">
          <div class="admin-title row">
            <el-icon><Setting /></el-icon>
            <span>管理员登录</span>
          </div>
          <div class="secure-note">
            安全区域，请妥善保管账户信息
          </div>
          <el-form :model="adminForm" :rules="rules" ref="formRef" label-position="top">
            <el-form-item label="管理员账号" prop="username">
              <el-input v-model="adminForm.username" placeholder="请输入管理员账号" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="adminForm.password" :type="pwdVisible ? 'text' : 'password'" placeholder="请输入密码">
                <template #suffix>
                  <el-button link @click="pwdVisible = !pwdVisible">{{ pwdVisible ? '隐藏' : '显示' }}</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-checkbox v-model="rememberAdmin" class="remember">保持登录状态</el-checkbox>
            <el-button
              class="action-btn gold"
              size="large"
              :loading="adminLoading"
              @click="handleAdminLogin"
            >安全登录</el-button>
          </el-form>
          <div class="copyright">ArtChain Auction System v1.0</div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { connectWallet, checkMetaMask } from '@/utils/wallet'
import { ElMessage } from 'element-plus'
import { Wallet, Setting } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref<'user'|'admin'>('user')
const connectState = ref<'idle' | 'loading' | 'connected'>('idle')
const address = ref<string>('')
const truncatedAddress = computed(() => {
  if (!address.value) return ''
  const a = address.value
  return a.slice(0, 6) + '...' + a.slice(-4)
})

const animatedIn = ref(false)
onMounted(() => {
  animatedIn.value = true
  if (userStore.role === 'admin') {
    activeTab.value = 'admin'
    router.replace('/admin/dashboard')
    return
  }
  if (userStore.address) {
    address.value = userStore.address
    connectState.value = 'connected'
  }
})

const wait = (ms: number) => new Promise(res => setTimeout(res, ms))
const handleConnect = async () => {
  try {
    connectState.value = 'loading'
    await wait(2000)
    if (!checkMetaMask()) {
      ElMessage.warning('未检测到 MetaMask，将使用演示模式连接')
      address.value = '0xDEMO0000000000000000000000000000DEMO1234'
      userStore.setAddress(address.value)
      userStore.setRole('buyer')
    } else {
      const addr = await connectWallet()
      address.value = addr
      userStore.setRole('buyer')
    }
    connectState.value = 'connected'
  } catch (e: any) {
    connectState.value = 'idle'
    ElMessage.error(e?.message || '连接失败')
  }
}

const goBuyerHome = () => {
  const q = String(route.query.redirect || '')
  const redirect = q && !q.startsWith('/admin') ? q : '/auctions'
  router.push(redirect)
}

const adminForm = ref({ username: '', password: '' })
const adminLoading = ref(false)
const pwdVisible = ref(false)
const formRef = ref<any>()
const shakeCard = ref(false)
const rememberUser = ref(false)
const rememberAdmin = ref(false)

const rules = {
  username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleAdminLogin = async () => {
  if (!formRef.value) return
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      shake()
      ElMessage.error('请填写完整账号与密码')
      return
    }
    adminLoading.value = true
    await wait(800)
    if (adminForm.value.username === 'admin' && adminForm.value.password === 'admin888') {
      userStore.setRole('admin')
      ElMessage.success('登录成功')
      const q = String(route.query.redirect || '')
      const dest = q && q.startsWith('/admin') ? q : '/admin/dashboard'
      router.push(dest)
    } else {
      shake()
      ElMessage.error('账号或密码错误')
    }
    adminLoading.value = false
  })
}

const shake = () => {
  shakeCard.value = false
  requestAnimationFrame(() => {
    shakeCard.value = true
    setTimeout(() => (shakeCard.value = false), 500)
  })
}
</script>

<style scoped lang="scss">
.login-landing {
  min-height: 100vh;
  background: url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1600') center/cover no-repeat fixed;
  position: relative;
  display: flex;
  align-items: center;
  color: #fff;
}
.login-landing::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, .65), rgba(30, 41, 59, .65));
}
.login-landing > .container {
  position: relative;
}
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}
.brand {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
}
.brand .brand-mark {
  font-size: 56px;
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #c9a86a, #e0c587, #b98a3b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.brand .subtitle {
  margin-top: 8px;
  font-size: 18px;
  color: #cbd5e1;
}
.frame-decor {
  margin-top: 32px;
  width: 240px;
  height: 160px;
  border: 8px solid rgba(201, 168, 106, 0.35);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(201, 168, 106, 0.18);
  background: url('https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=800') center/cover no-repeat;
}
.panel {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.card {
  width: 460px;
  min-height: 380px;
}
.tabs {
  display: flex;
  background: #ffffff;
  padding: 6px;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  gap: 6px;
  margin-bottom: 16px;
}
.tab {
  padding: 10px 18px;
  border-radius: 999px;
  background: transparent;
  border: none;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
}
.tab.active {
  background: linear-gradient(180deg, #e8f0ff, #ffffff);
  color: #1e293b;
  box-shadow: 0 6px 16px rgba(59,130,246,0.15);
}
.card {
  border-radius: 16px;
  overflow: hidden;
  padding: 20px;
  background: #fff;
  color: #111827;
}
.user-card .user-title { font-size: 22px; font-weight: 800; color: #1f2937; }
.user-card .user-tip { margin: 6px 0 14px; color: #6b7280; }
.wallet-state {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.wallet-state .addr {
  font-family: monospace;
  color: #111827;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
}
.action-btn {
  width: 100%;
  height: 44px;
  margin-top: 6px;
}
.gold {
  background: linear-gradient(90deg, #d4af37, #b8860b);
  border: none;
  color: #fff;
}
.gold:hover {
  box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.5), 0 0 25px 5px rgba(212, 175, 55, 0.45);
}
.remember { margin: 10px 0 6px; color: #6b7280; }
.secure-note {
  margin: 8px 0 16px;
  background: #fff7ed;
  color: #a16207;
  border: 1px solid #fde68a;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}
.admin-btn { width: 100%; }
.copyright {
  margin-top: 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
}
.fade-up {
  animation: fadeUp .6s ease both;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.shake {
  animation: shake .4s ease both;
}
@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(3px); }
  30%, 50%, 70% { transform: translateX(-5px); }
  40%, 60% { transform: translateX(5px); }
}
@media (max-width: 900px) {
  .container {
    grid-template-columns: 1fr;
  }
  .brand {
    align-items: center;
    text-align: center;
  }
  .card { width: 100%; min-height: auto; }
}
</style>
