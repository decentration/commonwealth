import * as Sequelize from 'sequelize';
import { BuildOptions, Model, DataTypes } from 'sequelize';

import { OffchainCommunityAttributes } from './offchain_community';
import { ChainAttributes } from './chain';

export interface InviteCodeAttributes {
  id?: string;
  community_id?: string;
  community_name?: string;
  chain_id?: string;
  creator_id: number;
  invited_email?: string;
  used?: boolean;
  created_at?: Date;
  updated_at?: Date;
  OffchainCommunity?: OffchainCommunityAttributes;
  Chain?: ChainAttributes;
}

export interface InviteCodeInstance
extends Model<InviteCodeAttributes>, InviteCodeAttributes {}

type InviteCodeModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): InviteCodeInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): InviteCodeModelStatic => {
  const InviteCode = <InviteCodeModelStatic>sequelize.define('InviteCode', {
    id: { type: dataTypes.STRING, primaryKey: true },
    community_id: { type: dataTypes.STRING, allowNull: true },
    chain_id: { type: dataTypes.STRING, allowNull: true },
    community_name: { type: dataTypes.STRING, allowNull: true },
    creator_id: { type: dataTypes.INTEGER, allowNull: false },
    invited_email: { type: dataTypes.STRING, allowNull: true, defaultValue: null },
    used: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    tableName: 'InviteCodes',
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['id'], unique: true },
      { fields: ['creator_id'] },
    ],
  });

  InviteCode.associate = (models) => {
    models.InviteCode.belongsTo(models.OffchainCommunity, { foreignKey: 'community_id', targetKey: 'id' });
    models.InviteCode.belongsTo(models.Chain, { foreignKey: 'chain_id', targetKey: 'id' });
  };

  return InviteCode;
};
