import * as Sequelize from 'sequelize';
import { Model, DataTypes } from 'sequelize';
import { ChainAttributes } from './chain';
import { OffchainThreadAttributes } from './offchain_thread';
import { ChainEventAttributes } from './chain_event';
import { ModelStatic } from './types';

export interface ChainEntityAttributes {
  chain: string;
  type: string;
  type_id: string;
  id?: number;
  thread_id?: number;
  title?: string;
  author?: string;
  completed?: boolean;
  created_at?: Date;
  updated_at?: Date;

  Chain?: ChainAttributes;
  OffchainThread?: OffchainThreadAttributes;
  ChainEvents?: ChainEventAttributes[];
}

export interface ChainEntityInstance
extends Model<ChainEntityAttributes>, ChainEntityAttributes {}

export type ChainEntityModelStatic = ModelStatic<ChainEntityInstance>

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChainEntityModelStatic => {
  const ChainEntity = <ChainEntityModelStatic>sequelize.define<ChainEntityInstance, ChainEntityAttributes>('ChainEntity', {
    id: { type: dataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chain: { type: dataTypes.STRING, allowNull: false },
    type: { type: dataTypes.STRING, allowNull: false },
    type_id: { type: dataTypes.STRING, allowNull: false },
    thread_id: { type: dataTypes.INTEGER, allowNull: true },
    completed: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    title: { type: dataTypes.STRING, allowNull: true },
    author: { type: dataTypes.STRING, allowNull: true },
    created_at: { type: dataTypes.DATE, allowNull: false },
    updated_at: { type: dataTypes.DATE, allowNull: false },
  }, {
    tableName: 'ChainEntities',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['id'] },
      { fields: ['thread_id'] },
      { fields: ['chain', 'type', 'id' ] },
    ],
  });

  ChainEntity.associate = (models) => {
    models.ChainEntity.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });
    models.ChainEntity.belongsTo(models.OffchainThread, { foreignKey: 'thread_id', targetKey: 'id' });
    models.ChainEntity.hasMany(models.ChainEvent, { foreignKey: 'entity_id' });
  };

  return ChainEntity;
};
