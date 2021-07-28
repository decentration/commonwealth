import * as Sequelize from 'sequelize'; // must use "* as" to avoid scope errors
import { RegisteredTypes } from '@polkadot/types/types';
import { BuildOptions, Model, DataTypes } from 'sequelize';
import { AddressAttributes } from './address';
import { ChainNodeInstance, ChainNodeAttributes } from './chain_node';
import { StarredCommunityAttributes } from './starred_community';
import { OffchainTopicAttributes } from './offchain_topic';
import { OffchainThreadAttributes } from './offchain_thread';
import { OffchainCommentAttributes } from './offchain_comment';
import { UserAttributes } from './user';


export interface ChainAttributes {
  id?: string;
  name: string;
  description?: string;
  discord?: string;
  element?: string;
  website?: string;
  telegram?: string;
  github?: string;
  featured_topics: string[];
  symbol: string;
  network: string;
  base: string;
  ss58_prefix?: number;
  icon_url: string;
  blockExplorerIds: string;
  collapsed_on_homepage: boolean;
  active: boolean;
  stagesEnabled: boolean;
  additionalStages: string;
  customDomain: string;
  type: string;
  substrate_spec: RegisteredTypes;

  // associations
  ChainNodes?: ChainNodeAttributes[] | ChainNodeAttributes['id'][];
  Addresses?: AddressAttributes[] | AddressAttributes['id'][];
  StarredCommunities?: StarredCommunityAttributes[] | StarredCommunityAttributes['id'][];
  topics?: OffchainTopicAttributes[] | OffchainTopicAttributes['id'][];
  OffchainThreads?: OffchainThreadAttributes[] | OffchainThreadAttributes['id'][];
  OffchainComments?: OffchainCommentAttributes[] | OffchainCommentAttributes['id'][];
  Users?: UserAttributes[] | UserAttributes['id'][];
  ChainObjectVersion?; // TODO
}

export interface ChainInstance extends Model<ChainAttributes>, ChainAttributes {
  // add mixins as needed
  getChainNodes: Sequelize.HasManyGetAssociationsMixin<ChainNodeInstance>;
}

type ChainModelStatic = typeof Model
    & { associate: (models: any) => void }
    & { new(values?: Record<string, unknown>, options?: BuildOptions): ChainInstance }

export default (
  sequelize: Sequelize.Sequelize,
  dataTypes: typeof DataTypes,
): ChainModelStatic => {
  const Chain = <ChainModelStatic>sequelize.define('Chain', {
    id: { type: dataTypes.STRING, primaryKey: true },
    name: { type: dataTypes.STRING, allowNull: false },
    description: { type: dataTypes.STRING, allowNull: true },
    website: { type: dataTypes.STRING, allowNull: true },
    discord: { type: dataTypes.STRING, allowNull: true },
    element: { type: dataTypes.STRING, allowNull: true },
    telegram: { type: dataTypes.STRING, allowNull: true },
    github: { type: dataTypes.STRING, allowNull: true },
    featured_topics: { type: dataTypes.ARRAY(dataTypes.STRING), allowNull: false, defaultValue: [] },
    symbol: { type: dataTypes.STRING, allowNull: false },
    network: { type: dataTypes.STRING, allowNull: false },
    base: { type: dataTypes.STRING, allowNull: false, defaultValue: '' },
    ss58_prefix: { type: dataTypes.INTEGER, allowNull: true },
    icon_url: { type: dataTypes.STRING },
    active: { type: dataTypes.BOOLEAN },
    stagesEnabled: { type: dataTypes.BOOLEAN, allowNull: true, defaultValue: true },
    additionalStages: { type: dataTypes.STRING, allowNull: true },
    customDomain: { type: dataTypes.STRING, allowNull: true, },
    blockExplorerIds: { type: dataTypes.STRING, allowNull: true, },
    collapsed_on_homepage: { type: dataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    type: { type: dataTypes.STRING, allowNull: false },
    substrate_spec: { type: dataTypes.JSONB, allowNull: true },
  }, {
    tableName: 'Chains',
    timestamps: false,
    underscored: true,
  });

  Chain.associate = (models) => {
    models.Chain.hasMany(models.ChainNode, { foreignKey: 'chain' });
    models.Chain.hasMany(models.Address, { foreignKey: 'chain' });
    models.Chain.hasMany(models.OffchainTopic, { as: 'topics', foreignKey: 'chain_id', });
    models.Chain.hasMany(models.OffchainThread, { foreignKey: 'chain' });
    models.Chain.hasMany(models.OffchainComment, { foreignKey: 'chain' });
    models.Chain.hasMany(models.StarredCommunity, { foreignKey: 'chain' });
    models.Chain.belongsToMany(models.User, { through: models.WaitlistRegistration });
  };

  return Chain;
};
