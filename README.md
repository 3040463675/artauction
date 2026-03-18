# 基于区块链的艺术品竞拍系统

基于以太坊区块链的艺术品拍卖系统，支持NFT艺术品铸造、拍卖竞价、自动结算等功能。

## 📁 项目结构

```
art-auction/
├── contracts/          # Solidity 智能合约
│   ├── ArtNFT.sol     # NFT艺术品合约
│   └── Auction.sol    # 拍卖合约
├── frontend/          # Vue 3 前端应用
├── backend/           # Node.js 后端服务
└── scripts/           # 部署脚本
```

## 🛠️ 技术栈

### 区块链
- Solidity ^0.8.19
- Hardhat 开发框架
- Ethers.js
- OpenZeppelin 合约库

### 前端
- Vue 3 + TypeScript
- Vite
- Pinia 状态管理
- Element Plus UI
- Ethers.js / Wagmi

### 后端
- Node.js + Express
- MySQL + Sequelize
- JWT 认证

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装智能合约依赖
cd contracts && npm install

# 安装前端依赖
cd frontend && npm install

# 安装后端依赖
cd backend && npm install
```

### 2. 配置环境变量

复制各目录下的 `.env.example` 为 `.env` 并填写配置。

### 3. 启动开发环境

```bash
# 启动本地区块链（开发环境）
cd contracts && npx hardhat node

# 部署合约
cd contracts && npx hardhat run scripts/deploy.ts --network localhost

# 启动后端
cd backend && npm run dev

# 启动前端
cd frontend && npm run dev
```

## 📝 功能模块

### 用户角色
- **管理员**: 用户管理、系统配置、数据统计
- **拍卖行**: 艺术品审核、拍卖活动管理、成交确认
- **卖家**: 艺术品发布、查看拍卖进展、收款
- **买家**: 浏览艺术品、参与竞拍、支付结算

### 核心功能
- NFT艺术品铸造与上链
- 智能合约拍卖逻辑
- ETH/代币支付结算
- 竞拍记录链上存证
- MetaMask钱包集成

## 📄 License

MIT
