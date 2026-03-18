import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

// 出价记录模型类
class Bid extends Model {
  public id!: number
  public auctionId!: number
  public bidderAddress!: string
  public amount!: string
  public txHash!: string | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Bid.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    auctionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '拍卖ID'
    },
    bidderAddress: {
      type: DataTypes.STRING(42),
      allowNull: false,
      comment: '出价者地址'
    },
    amount: {
      type: DataTypes.DECIMAL(30, 18),
      allowNull: false,
      comment: '出价金额(ETH)'
    },
    txHash: {
      type: DataTypes.STRING(66),
      allowNull: true,
      comment: '交易哈希'
    }
  },
  {
    sequelize,
    tableName: 'bids',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['auction_id'] },
      { fields: ['bidder_address'] },
      { fields: ['created_at'] }
    ]
  }
)

export default Bid
