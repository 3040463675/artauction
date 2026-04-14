import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

// 用户模型类
class User extends Model {
  public id!: number
  public address!: string
  public username!: string | null
  public avatar!: string | null
  public email!: string | null
  public role!: 'admin' | 'auction_house' | 'seller' | 'buyer'
  public nonce!: string
  public bio!: string | null
  public enabled!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

// 定义模型
User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    address: {
      type: DataTypes.STRING(42),
      allowNull: false,
      comment: '钱包地址'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '用户名'
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '头像URL'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    role: {
      type: DataTypes.ENUM('admin', 'auction_house', 'seller', 'buyer'),
      allowNull: false,
      defaultValue: 'buyer',
      comment: '用户角色'
    },
    nonce: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: () => Math.random().toString(36).substring(2, 15),
      comment: '签名随机数'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '个人简介'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否启用（封禁/解封）'
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['address'], name: 'users_address_unique' },
      { fields: ['role'], name: 'users_role_index' },
      { fields: ['enabled'], name: 'users_enabled_index' }
    ]
  }
)

export default User
