import 'dotenv/config'
import { sequelize } from '../config/database'
import { setupAssociations } from '../models'
import { User, Artwork, Auction, Category, AuctionStatus } from '../models'

const run = async () => {
  try {
    setupAssociations()
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')

    const defaultAddresses = [
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
    ]

    for (const addr of defaultAddresses) {
      await User.findOrCreate({
        where: { address: addr },
        defaults: { address: addr, username: `Artist_${addr.slice(2, 6)}`, role: 'seller' }
      })
    }

    const cat = await Category.findOne({ where: { slug: 'digital-art' } })
    const categoryId = cat ? cat.id : 1

    const names = [
      '晨光序曲', '镜像之城', '量子迷踪', '风暴之眼', '寂静之蓝',
      '裂隙花园', '光的折线', '赛博钟摆', '星海拾贝', '重力弯月',
      '尘埃记忆', '像素涟漪', '黑曜之翼', '余晖纪元', '霓虹之潮',
      '回声剧场', '无界之门', '云端之上', '静默回环', '流光之径'
    ]

    console.log('🚀 正在批量创建 20 件艺术品与拍卖...')

    const baseTokenId = 5000
    const baseAuctionId = 9000
    const endTime = new Date(Date.now() + 15 * 24 * 3600 * 1000)

    let createdCount = 0
    for (let i = 0; i < names.length; i++) {
      const name = names[i]
      const seller = defaultAddresses[i % defaultAddresses.length]
      const start = (0.3 + Math.random() * 2).toFixed(2)
      const current = (Number(start) + Math.random() * 3).toFixed(2)

      const user = await User.findOne({ where: { address: seller } })

      const [artwork] = await Artwork.findOrCreate({
        where: { name },
        defaults: {
          tokenId: baseTokenId + i,
          name,
          description: `数字艺术作品《${name}》，探索技术与艺术的交互边界。`,
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(name)}/1000/800`,
          creatorId: user!.id,
          ownerAddress: seller,
          categoryId,
          isVerified: true,
          isOnAuction: true
        }
      })

      const auctionId = baseAuctionId + i
      const [auction, created] = await Auction.findOrCreate({
        where: { auctionId },
        defaults: {
          auctionId,
          artworkId: artwork.id,
          sellerAddress: seller,
          startingPrice: start,
          reservePrice: start,
          minIncrement: '0.1',
          startTime: new Date(),
          endTime,
          highestBid: current,
          status: AuctionStatus.Active,
          isHot: Math.random() > 0.7
        }
      })

      if (!created) {
        await auction.update({ endTime, status: AuctionStatus.Active })
      }

      createdCount++
      console.log(`   ✅ 第 ${i + 1}/20 件：${name}`)
    }

    console.log(`\n🎉 已完成：新增/就绪 ${createdCount} 件艺术品及对应拍卖，均设置为进行中，15 天后结束。`)
    process.exit(0)
  } catch (err) {
    console.error('❌ 失败：', err)
    process.exit(1)
  }
}

run()

