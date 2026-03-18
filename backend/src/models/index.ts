// 导入所有模型
import User from './User'
import Artwork from './Artwork'
import Auction, { AuctionStatus } from './Auction'
import Bid from './Bid'
import Category from './Category'

// 定义模型关联关系
export const setupAssociations = () => {
  // User -> Artwork (一对多)
  User.hasMany(Artwork, { foreignKey: 'creatorId', as: 'artworks' })
  Artwork.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' })

  // User -> Auction (一对多，作为卖家)
  User.hasMany(Auction, { foreignKey: 'sellerAddress', sourceKey: 'address', as: 'sellingAuctions' })
  Auction.belongsTo(User, { foreignKey: 'sellerAddress', targetKey: 'address', as: 'seller' })

  // Artwork -> Auction (一对多)
  Artwork.hasMany(Auction, { foreignKey: 'artworkId', as: 'auctions' })
  Auction.belongsTo(Artwork, { foreignKey: 'artworkId', as: 'artwork' })

  // Auction -> Bid (一对多)
  Auction.hasMany(Bid, { foreignKey: 'auctionId', as: 'bids' })
  Bid.belongsTo(Auction, { foreignKey: 'auctionId', as: 'auction' })

  // User -> Bid (一对多)
  User.hasMany(Bid, { foreignKey: 'bidderAddress', sourceKey: 'address', as: 'bids' })
  Bid.belongsTo(User, { foreignKey: 'bidderAddress', targetKey: 'address', as: 'bidder' })

  // Category -> Artwork (一对多)
  Category.hasMany(Artwork, { foreignKey: 'categoryId', as: 'artworks' })
  Artwork.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' })
}

// 导出模型和枚举
export { User, Artwork, Auction, Bid, Category, AuctionStatus }
