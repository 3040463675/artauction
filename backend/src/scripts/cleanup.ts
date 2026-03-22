import 'dotenv/config'
import { sequelize } from '../config/database'
import { setupAssociations } from '../models'
import { Artwork, Auction, Bid } from '../models'

const cleanup = async () => {
  try {
    setupAssociations()
    await sequelize.authenticate()
    console.log('✅ 数据库连接成功')

    const idsToDelete = [9, 10]

    for (const id of idsToDelete) {
      console.log(`🚀 正在删除作品 ID: ${id}...`)
      
      // 1. 查找作品
      const artwork = await Artwork.findByPk(id)
      if (!artwork) {
        console.warn(`⚠️ 作品 ID ${id} 不存在，跳过`)
        continue
      }

      // 2. 查找关联的拍卖
      const auctions = await Auction.findAll({ where: { artworkId: id } })
      
      for (const auction of auctions) {
        // 3. 删除出价记录
        await Bid.destroy({ where: { auctionId: auction.id } })
        // 4. 删除拍卖记录
        await auction.destroy()
        console.log(`   - 已删除拍卖 ID: ${auction.id}`)
      }

      // 5. 删除作品记录
      await artwork.destroy()
      console.log(`   - 已删除作品: ${artwork.name}`)
    }

    console.log('\n🎉 清理完成！')
    process.exit(0)
  } catch (error) {
    console.error('❌ 清理失败:', error)
    process.exit(1)
  }
}

cleanup()
