import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';
import { ChainEventAttributes } from './chain_event';
import { ChainAttributes } from './chain';


export interface ChainEventTypeAttributes {
  id: string;
  chain: string;
  event_name: string;

  ChainEvents?: ChainEventAttributes[];
  Chain?: ChainAttributes;
}

export interface ChainEventTypeInstance
extends Model<ChainEventTypeAttributes>, ChainEventTypeAttributes {}

type ChainEventTypeModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): ChainEventTypeInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChainEventTypeModelStatic => {
  const ChainEventType = <ChainEventTypeModelStatic>sequelize.define('ChainEventType', {
    // id = chain-event_name (event_name is value of string enum)
    id: { type: dataTypes.STRING, primaryKey: true },
    chain: { type: dataTypes.STRING, allowNull: false },
    event_name: { type: dataTypes.STRING, allowNull: false },
  }, {
    tableName: 'ChainEventTypes',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['id'] },
      { fields: ['chain', 'event_name'] },
    ],
  });

  ChainEventType.associate = (models) => {
    // chain the event happens on
    models.ChainEventType.belongsTo(models.Chain, { foreignKey: 'chain', targetKey: 'id' });

    // many emitted events of this type
    models.ChainEventType.hasMany(models.ChainEvent, { as: 'events' });

    // many users subscribed to this event type
    // TODO: this is currently unused, but could be useful?
    // models.ChainEventType.hasMany(models.Subscription, { as: 'subscriptions' });
  };

  return ChainEventType;
};
