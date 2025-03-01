import moment from 'moment';
import { ApiStatus, IApp } from 'state';
import { Coin } from 'adapters/currency';
import { clearLocalStorage } from 'stores/PersistentStore';
import $ from 'jquery';
import m from 'mithril';

import { CommentRefreshOption } from 'controllers/server/comments';
import ChainEntityController, { EntityRefreshOption } from 'controllers/server/chain_entities';
import { IChainModule, IAccountsModule, IBlockInfo } from './interfaces';
import { ChainBase } from './types';
import { Account, NodeInfo, ProposalModule } from '.';

// Extended by a chain's main implementation. Responsible for module
// initialization. Saved as `app.chain` in the global object store.
// TODO: move this from `app.chain` or else rename `chain`?
abstract class IChainAdapter<C extends Coin, A extends Account<C>> {
  protected _apiInitialized: boolean = false;
  public get apiInitialized() { return this._apiInitialized; }

  protected _loaded: boolean = false;
  public get loaded() { return this._loaded; }

  protected _failed: boolean = false;
  public get failed() { return this._failed; }

  public abstract chain: IChainModule<C, A>;
  public abstract accounts: IAccountsModule<C, A>;
  public readonly chainEntities?: ChainEntityController;
  public readonly usingServerChainEntities = false;

  public deferred: boolean;

  protected _serverLoaded: boolean;
  public get serverLoaded() { return this._serverLoaded; }

  public async initServer(): Promise<boolean> {
    clearLocalStorage();
    console.log(`Starting ${this.meta.chain.name}`);
    let response;
    if (this.chainEntities) {
      // if we're loading entities from chain, only pull completed
      const refresh = this.usingServerChainEntities
        ? EntityRefreshOption.AllEntities
        : EntityRefreshOption.CompletedEntities;

      let _unused1, _unused2;
      [_unused1, _unused2, response] = await Promise.all([
        this.chainEntities.refresh(this.meta.chain.id, refresh),
        this.app.comments.refreshAll(
          this.meta.chain.id,
          null,
          CommentRefreshOption.LoadProposalComments
        ),
        $.get(`${this.app.serverUrl()}/bulkOffchain`, {
          chain: this.id,
          community: null,
          jwt: this.app.user.jwt,
        }),
      ]);
    } else {
      response = await $.get(`${this.app.serverUrl()}/bulkOffchain`, {
        chain: this.id,
        community: null,
        jwt: this.app.user.jwt,
      });
    }

    // If user is no longer on the initializing chain, abort initialization
    // and return false, so that the invoking selectNode fn can similarly
    // break, rather than complete.
    if (this.meta.chain.id !== (this.app.customDomainId() || m.route.param('scope'))) {
      return false;
    }

    const {
      threads, comments, reactions, topics, admins, activeUsers, numVotingThreads
    } = response.result;
    this.app.threads.initialize(threads, numVotingThreads, true);
    this.app.comments.initialize(comments, false);
    this.app.reactions.initialize(reactions, true);
    this.app.topics.initialize(topics, true);
    this.meta.chain.setAdmins(admins);
    this.app.recentActivity.setMostActiveUsers(activeUsers);

    this._serverLoaded = true;
    return true;
  }

  public deinitServer() {
    this._serverLoaded = false;
    this.app.threads.deinit();
    this.app.comments.deinit();
    this.app.reactions.deinit();
    if (this.chainEntities) {
      this.chainEntities.deinit();
    }
    console.log(`${this.meta.chain.name} stopped`);
  }

  public async initApi(): Promise<void> {
    this._apiInitialized = true;
    console.log(`Started API for ${this.meta.chain.id} on node: ${this.meta.url}.`);
  }

  public async initData(): Promise<void> {
    this._loaded = true;
    this.app.chainModuleReady.emit('ready');
    this.app.isModuleReady = true;
    console.log(`Loaded data for ${this.meta.chain.id} on node: ${this.meta.url}.`);
  }

  public async deinit(): Promise<void> {
    this._apiInitialized = false;
    this.app.isModuleReady = false;
    this._loaded = false;
    console.log(`Stopping ${this.meta.chain.id}...`);
  }

  public async loadModules(modules: ProposalModule<any, any, any>[]) {
    if (!this.loaded) {
      throw new Error('secondary loading cmd called before chain load');
    }
    // TODO: does this need debouncing?
    if (modules.some((mod) => !mod.initializing && !mod.ready)) {
      await Promise.all(modules.map((mod) => mod.init(this.chain, this.accounts)));
    }
    m.redraw();
  }

  public abstract base: ChainBase;

  public networkStatus: ApiStatus = ApiStatus.Disconnected;
  public networkError: string;

  public readonly meta: NodeInfo;
  public readonly block: IBlockInfo;

  public app: IApp;
  public version: string;
  public name: string;
  public runtimeName: string;

  constructor(meta: NodeInfo, app: IApp) {
    this.meta = meta;
    this.app = app;
    this.block = {
      height: 0,
      duration: 0,
      lastTime: moment(),
      isIrregular: false,
    };
  }

  get id() {
    return this.meta.chain.id;
  }
  get network() {
    return this.meta.chain.network;
  }
  get currency() {
    return this.meta.chain.symbol;
  }
}

export default IChainAdapter;
