import 'dotenv/config'
import { sequelize } from '../config/database'
import { setupAssociations } from '../models'
import { User, Artwork, Auction, Bid, Category } from '../models'

const initDatabase = async () => {
  try {
    // 设置模型关联
    setupAssociations()

    // 同步数据库（force: true 会删除现有表）
    await sequelize.sync({ force: true })
    console.log('✅ 数据库表已创建')

    // 创建默认分类
    const categories = await Category.bulkCreate([
      { name: '油画', slug: 'oil-painting', sort: 1 },
      { name: '水彩', slug: 'watercolor', sort: 2 },
      { name: '版画', slug: 'print', sort: 3 },
      { name: '雕塑', slug: 'sculpture', sort: 4 },
      { name: '摄影', slug: 'photography', sort: 5 },
      { name: '数字艺术', slug: 'digital-art', sort: 6 },
      { name: '书法', slug: 'calligraphy', sort: 7 },
      { name: '其他', slug: 'other', sort: 99 }
    ])
    console.log('✅ 默认分类已创建')

    // 创建管理员账户
    const admin = await User.create({
      address: '0x0000000000000000000000000000000000000000',
      username: 'Admin',
      role: 'admin',
      email: 'admin@example.com'
    })
    console.log('✅ 管理员账户已创建')

    console.log('\n🎉 数据库初始化完成!')
    process.exit(0)
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    process.exit(1)
  }
}

initDatabase()
