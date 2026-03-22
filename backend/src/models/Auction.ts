import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

// 拍卖状态枚举
export enum AuctionStatus {
  Pending = 0,
  Active = 1,
  Ended = 2,
  Cancelled = 3,
  Settled = 4
}

// 拍卖模型类
class Auction extends Model {
  public id!: number
  public auctionId!: number
  public artworkId!: number
  public sellerAddress!: string
  public startingPrice!: string
  public reservePrice!: string
  public minIncrement!: string
  public startTime!: Date
  public endTime!: Date
  public highestBid!: string
  public highestBidder!: string | null
  public status!: AuctionStatus
  public isHot!: boolean
  public txHash!: string | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Auction.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    auctionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      comment: '链上拍卖ID'
    },
    artworkId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '关联艺术品ID'
    },
    sellerAddress: {
      type: DataTypes.STRING(42),
      allowNull: false,
      comment: '卖家地址'
    },
    startingPrice: {
      type: DataTypes.DECIMAL(20, 18),
      allowNull: false,
      comment: '起拍价格'
    },
    reservePrice: {
      type: DataTypes.DECIMAL(20, 18),
      allowNull: false,
      comment: '保留价格'
    },
    minIncrement: {
      type: DataTypes.DECIMAL(20, 18),
      allowNull: false,
      comment: '最低加价'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '开始时间'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '结束时间'
    },
    highestBid: {
      type: DataTypes.DECIMAL(20, 18),
      allowNull: false,
      defaultValue: '0',
      comment: '当前最高出价'
    },
    highestBidder: {
      type: DataTypes.STRING(42),
      allowNull: true,
      comment: '当前最高出价者'
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: AuctionStatus.Pending,
      comment: '拍卖状态'
    },
    isHot: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_hot',
      comment: '是否为热门推荐'
    },
    txHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      comment: '交易哈希'
    }
  },
  {
    sequelize,
    tableName: 'auctions',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['auction_id'] },
      { fields: ['artwork_id'] },
      { fields: ['seller_address'] },
      { fields: ['status'] },
      { fields: ['end_time'] }
    ]
  }
)

export default Auction
