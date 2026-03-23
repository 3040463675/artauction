import 'dotenv/config'
import { sequelize } from '../config/database'
import { setupAssociations } from '../models'
import { User, Artwork, Auction, Category, AuctionStatus } from '../models'

const seedDatabase = async () => {
  try {
    // 设置模型关联
    setupAssociations()

    // 确保数据库连接正常
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')

    // 1. 确保分类存在
    const digitalArtCategory = await Category.findOne({ where: { slug: 'digital-art' } })
    const categoryId = digitalArtCategory ? digitalArtCategory.id : 1

    // 2. 确保默认用户存在（创作者和卖家）
    const defaultAddresses = [
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    ]

    for (const addr of defaultAddresses) {
      await User.findOrCreate({
        where: { address: addr },
        defaults: {
          address: addr,
          username: `Artist_${addr.slice(2, 6)}`,
          role: 'seller'
        }
      })
    }
    console.log('✅ 默认用户已就绪')

    // 3. 模拟数据定义 (全 8 件作品)
    const mockData = [
      {
        id: 'mock-a1',
        name: '未来之光',
        imageUrl: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&q=80&w=1000',
        description: '探索数字艺术的无限可能，这是一件融合了赛博朋克风格与未来主义色彩的杰作。',
        creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        price: '1.5',
        start: '1.0',
        increment: '0.1',
        isHot: true
      },
      {
        id: 'mock-a2',
        name: '深海共鸣',
        imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=1000',
        description: '潜入深蓝的梦境，感受来自海洋深处的低频震动。这件作品捕捉了水下光影的瞬间变幻。',
        creator: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        price: '2.8',
        start: '2.0',
        increment: '0.2',
        isHot: true
      },
      {
        id: 'mock-a3',
        name: '数字荒原',
        imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=1000',
        description: '在 0 和 1 构成的废墟上，新生命正在悄然萌芽。这是一场关于技术与自然共生的视觉探讨。',
        creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        price: '0.9',
        start: '0.5',
        increment: '0.05',
        isHot: true
      },
      {
        id: 'mock-a4',
        name: '城市之巅',
        imageUrl: 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?auto=format&fit=crop&q=80&w=1000',
        description: '俯瞰繁华都市的璀璨灯火，感受现代文明的脉动。作品采用了多重曝光技术，呈现出迷幻的视觉效果。',
        creator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        price: '3.2',
        start: '2.5',
        increment: '0.5',
        isHot: true
      },
      {
        id: 'mock-a5',
        name: '最后的晚餐 - 重构',
        imageUrl: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&q=80&w=1000',
        description: '对经典名画的数字化重构，用几何图形与高饱和度色彩重新诠释庄严的时刻。',
        creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        price: '5.6',
        start: '4.0',
        increment: '0.5'
      },
      {
        id: 'mock-a6',
        name: '赛博霓虹',
        imageUrl: 'https://images.unsplash.com/photo-1614728263952-84ea206f25bc?auto=format&fit=crop&q=80&w=1000',
        description: '霓虹灯火下的雨后街道，光线在积水中折射出五彩斑斓的倒影。',
        creator: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
        price: '1.2',
        start: '0.8',
        increment: '0.1'
      },
      {
        id: 'mock-a7',
        name: '意识流转',
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000',
        description: '捕捉思想流动的瞬间，将抽象的意识转化为具象的线条与色彩。',
        creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        price: '0.5',
        start: '0.3',
        increment: '0.05'
      },
      {
        id: 'mock-a8',
        name: '量子纠缠',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000',
        description: '微观世界的宏观表现，通过粒子碰撞的轨迹展现宇宙最底层的联系。',
        creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        price: '4.1',
        start: '3.5',
        increment: '0.2'
      }
    ]

    // 4. 动态生成 30 个额外作品
    const extraArtworks = [
      '抽象和谐', '赛博街道', '霓虹之梦', '空灵森林', '故障现实',
      '禅意花园', '流动黄金', '分形宇宙', '极简绽放', '星空2026',
      '几何灵魂', '海洋私语', '机器人情感', '时空扭曲', '虚拟绿洲',
      '数字宁静', '像素往事', '增强自然', '银河脉动', '无限循环',
      '无声回响', '辐射核心', '光影游戏', '晶莹剔透', '天鹅绒天空',
      '棱镜流动', '动能能量', '二进制日落', '合成生命', '宇宙呼吸'
    ]

    for (let i = 0; i < extraArtworks.length; i++) {
      const name = extraArtworks[i]
      const creator = defaultAddresses[i % defaultAddresses.length]
      mockData.push({
        id: `mock-extra-${i}`,
        name: name,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/1000/800`,
        description: `这是一件名为《${name}》的独特数字艺术品，探索了技术与艺术的深度融合。`,
        creator: creator,
        price: (Math.random() * 5).toFixed(2),
        start: (Math.random() * 2).toFixed(2),
        increment: '0.1'
      })
    }

    console.log('🚀 开始导入拍卖数据...')

    for (let i = 0; i < mockData.length; i++) {
      const data = mockData[i]
      const user = await User.findOne({ where: { address: data.creator } })
      
      // 创建艺术品
      const [artwork] = await Artwork.findOrCreate({
        where: { name: data.name },
        defaults: {
          tokenId: 2000 + i,
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          creatorId: user!.id,
          ownerAddress: data.creator,
          categoryId: categoryId,
          isVerified: !data.unverified, // 根据数据定义设置审核状态
          isOnAuction: true
        }
      })

      // 创建拍卖
      const numericId = 100 + i // 使用 100+ 作为模拟拍卖的 ID
      
      // 统一设置为 15 天结束
      const fixedEndTime = new Date(Date.now() + 15 * 24 * 3600 * 1000)

      // 查找或创建拍卖
      const [auctionRecord, created] = await Auction.findOrCreate({
        where: { auctionId: numericId },
        defaults: {
          auctionId: numericId,
          artworkId: artwork.id,
          sellerAddress: data.creator,
          startingPrice: data.start,
          reservePrice: data.start,
          minIncrement: data.increment,
          startTime: new Date(),
          endTime: fixedEndTime,
          highestBid: data.price,
          status: AuctionStatus.Active,
          isHot: (data as any).isHot || false
        }
      })

      // 如果已存在，更新其结束时间为统一 15 天
      if (!created) {
        await auctionRecord.update({
          endTime: fixedEndTime,
          isHot: (data as any).isHot || false
        })
      }
      
      console.log(`   ✅ 已导入: ${data.name}`)
    }

    console.log(`\n🎉 所有 ${mockData.length} 件模拟数据已成功存储到数据库!`)
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据导入失败:', error)
    process.exit(1)
  }
}

seedDatabase()
