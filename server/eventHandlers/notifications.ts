/**
 * Generic handler that transforms events into notifications.
 */
import WebSocket from 'ws';
import { IEventHandler, CWEvent, IChainEventKind } from '@commonwealth/chain-events';
import { NotificationCategories } from '../../shared/types';

import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

export default class extends IEventHandler {
  constructor(
    private readonly _models,
    private readonly _wss?: WebSocket.Server,
    private readonly _excludedEvents: IChainEventKind[] = [],
  ) {
    super();
  }

  /**
   * Handles an event by emitting notifications as needed.
   */
  public async handle(event: CWEvent, dbEvent) {
    // log.debug(`Received event: ${JSON.stringify(event, null, 2)}`);
    if (!dbEvent) {
      log.trace('No db event received! Ignoring.');
      return;
    }
    if (this._excludedEvents.includes(event.data.kind)) {
      log.trace('Skipping event!');
      return dbEvent;
    }
    try {
      const dbEventType = await dbEvent.getChainEventType();
      if (!dbEventType) {
        log.error('Failed to fetch event type! Ignoring.');
        return;
      }

      // locate subscriptions generate notifications as needed
      const dbNotifications = await this._models.Subscription.emitNotifications(
        this._models,
        NotificationCategories.ChainEvent,
        dbEventType.id,
        { chainEvent: dbEvent, chainEventType: dbEventType },
        { chainEvent: dbEvent, chainEventType: dbEventType }, // TODO: add webhook data once specced out
        this._wss,
        event.excludeAddresses,
        event.includeAddresses,
      );
      log.info(`Emitted ${dbNotifications.length} notifications.`);
      return dbEvent;
    } catch (e) {
      log.error(`Failed to generate notification: ${e.message}!`);
      return dbEvent;
    }
  }
}
