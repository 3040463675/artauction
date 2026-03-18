import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/database'

// 分类模型类
class Category extends Model {
  public id!: number
  public name!: string
  public slug!: string
  public description!: string | null
  public icon!: string | null
  public sort!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '分类名称'
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '分类标识'
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '分类描述'
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '图标'
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序'
    }
  },
  {
    sequelize,
    tableName: 'categories',
    timestamps: true,
    underscored: true
  }
)

export default Category
