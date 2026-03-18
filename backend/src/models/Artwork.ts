import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

// 艺术品模型类
class Artwork extends Model {
  public id!: number
  public tokenId!: number
  public name!: string
  public description!: string
  public imageUrl!: string
  public ipfsHash!: string | null
  public creatorId!: number
  public ownerAddress!: string
  public categoryId!: number | null
  public isVerified!: boolean
  public isOnAuction!: boolean
  public metadata!: object | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Artwork.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    tokenId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      comment: 'NFT Token ID'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '艺术品名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '艺术品描述'
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '图片URL'
    },
    ipfsHash: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'IPFS哈希'
    },
    creatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '创作者ID'
    },
    ownerAddress: {
      type: DataTypes.STRING(42),
      allowNull: false,
      comment: '所有者地址'
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '分类ID'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否已验证'
    },
    isOnAuction: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否在拍卖中'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '元数据'
    }
  },
  {
    sequelize,
    tableName: 'artworks',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['token_id'] },
      { fields: ['creator_id'] },
      { fields: ['owner_address'] },
      { fields: ['is_on_auction'] }
    ]
  }
)

export default Artwork
