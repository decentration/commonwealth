import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

export interface EdgewareLockdropEventAttributes {
  id?: number;
  origin: string;
  blocknum: number;
  timestamp?: string;
  name: string;
  data?: string;
}

export interface EdgewareLockdropEventInstance
extends Model<EdgewareLockdropEventAttributes>, EdgewareLockdropEventAttributes {}

type EdgewareLockdropEventModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): EdgewareLockdropEventInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): EdgewareLockdropEventModelStatic => {
  const EdgewareLockdropEvent = <EdgewareLockdropEventModelStatic>sequelize.define('EdgewareLockdropEvent', {
    id: { type: dataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    origin: { type: dataTypes.STRING, allowNull: false },
    blocknum: { type: dataTypes.INTEGER, allowNull: false },
    timestamp: { type: dataTypes.STRING, allowNull: true },
    name: { type: dataTypes.STRING, allowNull: false },
    data: { type: dataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'EdgewareLockdropEvents',
    underscored: true,
    timestamps: false,
    indexes: [
      { fields: ['origin', 'blocknum'] },
      { fields: ['origin', 'timestamp'] },
    ],
  });

  return EdgewareLockdropEvent;
};
