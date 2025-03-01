import 'pages/discussions/discussion_row_menu.scss';

import m from 'mithril';
import app from 'state';
import { navigateToSubpage } from 'app';
import { MenuItem, PopoverMenu, Icon, Icons, MenuDivider } from 'construct-ui';

import { NotificationCategories } from 'types';
import { OffchainThread, OffchainTopic, OffchainThreadStage } from 'models';

import TopicEditor from 'views/components/topic_editor';
import StageEditor from 'views/components/stage_editor';
import { notifySuccess } from 'controllers/app/notifications';
import { confirmationModalWithText } from '../../modals/confirm_modal';

export const ThreadSubscriptionMenuItem: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    const commentSubscription = app.user.notifications.subscriptions
      .find((v) => v.objectId === proposal.uniqueIdentifier && v.category === NotificationCategories.NewComment);

    const reactionSubscription = app.user.notifications.subscriptions
      .find((v) => v.objectId === proposal.uniqueIdentifier && v.category === NotificationCategories.NewReaction);

    const bothActive = (commentSubscription?.isActive && reactionSubscription?.isActive);

    return m(MenuItem, {
      onclick: async (e) => {
        e.preventDefault();
        if (!commentSubscription || !reactionSubscription) {
          await Promise.all([
            app.user.notifications.subscribe(NotificationCategories.NewReaction, proposal.uniqueIdentifier),
            app.user.notifications.subscribe(NotificationCategories.NewComment, proposal.uniqueIdentifier),
          ]);
          notifySuccess('Subscribed!');
        } else if (bothActive) {
          await app.user.notifications.disableSubscriptions([commentSubscription, reactionSubscription]);
          notifySuccess('Unsubscribed!');
        } else {
          await app.user.notifications.enableSubscriptions([commentSubscription, reactionSubscription]);
          notifySuccess('Subscribed!');
        }
        m.redraw();
      },
      label: (bothActive) ? 'Unsubscribe from notifications' : 'Subscribe to notifications',
    });
  },
};

export const ThreadDeletionMenuItem: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    return m(MenuItem, {
      onclick: async (e) => {
        e.preventDefault();
        const carat = (document.getElementsByClassName('cui-popover-trigger-active')[0] as HTMLButtonElement);
        if (carat) carat.click();
        const confirmed = await confirmationModalWithText('Delete this entire thread?')();
        if (!confirmed) return;
        app.threads.delete(proposal).then(() => {
          navigateToSubpage('/');
        });
      },
      label: 'Delete',
    });
  }
};

export const TopicEditorMenuItem: m.Component<{ openTopicEditor: Function }, { isOpen: boolean }> = {
  view: (vnode) => {
    const { openTopicEditor } = vnode.attrs;
    return m('.TopicEditorMenuItem', [
      m(MenuItem, {
        fluid: true,
        label: 'Edit topic',
        onclick: (e) => {
          e.preventDefault();
          openTopicEditor();
        },
      })
    ]);
  }
};

export const StageEditorMenuItem: m.Component<{ openStageEditor: Function }, { isOpen: boolean }> = {
  view: (vnode) => {
    const { openStageEditor } = vnode.attrs;

    if (!app.chain?.meta?.chain && !app.community?.meta) return;
    const { stagesEnabled } = app.chain?.meta?.chain || app.community?.meta;
    if (!stagesEnabled) return;

    return m('.StageEditorMenuItem', [
      m(MenuItem, {
        fluid: true,
        label: 'Edit stage',
        onclick: (e) => {
          e.preventDefault();
          openStageEditor();
        },
      })
    ]);
  }
};

const DiscussionRowMenu: m.Component<{ proposal: OffchainThread }, {
  topicEditorIsOpen: boolean,
  stageEditorIsOpen: boolean
}> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) return;
    const { proposal } = vnode.attrs;

    const hasAdminPermissions = app.user.activeAccount
    && (app.user.isRoleOfCommunity({
      role: 'admin',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    })
    || app.user.isRoleOfCommunity({
      role: 'moderator',
      chain: app.activeChainId(),
      community: app.activeCommunityId()
    }));

    const isAuthor = app.user.activeAccount
      && (proposal.author === app.user.activeAccount.address);

    return m('.DiscussionRowMenu', {
      onclick: (e) => {
        // prevent clicks from propagating to discussion row
        e.preventDefault();
        e.stopPropagation();
      }
    }, [
      m(PopoverMenu, {
        transitionDuration: 0,
        closeOnOutsideClick: true,
        closeOnContentClick: true,
        menuAttrs: {},
        content: [
          m(ThreadSubscriptionMenuItem, { proposal }),
          hasAdminPermissions && m(MenuDivider),
          hasAdminPermissions && m(MenuItem, {
            class: 'pin-thread-toggle',
            onclick: (e) => {
              e.preventDefault();
              app.threads.pin({ proposal }).then(() => m.redraw());
            },
            label: proposal.pinned ? 'Unpin thread' : 'Pin thread',
          }),
          hasAdminPermissions && m(MenuItem, {
            class: 'read-only-toggle',
            onclick: (e) => {
              e.preventDefault();
              app.threads.setPrivacy({
                threadId: proposal.id,
                readOnly: !proposal.readOnly,
              }).then(() => m.redraw());
            },
            label: proposal.readOnly ? 'Unlock thread' : 'Lock thread',
          }),
          hasAdminPermissions && m(TopicEditorMenuItem, {
            openTopicEditor: () => { vnode.state.topicEditorIsOpen = true; }
          }),
          (isAuthor || hasAdminPermissions) && m(StageEditorMenuItem, {
            openStageEditor: () => { vnode.state.stageEditorIsOpen = true; }
          }),
          (isAuthor || hasAdminPermissions) && m(ThreadDeletionMenuItem, { proposal }),
        ],
        inline: true,
        trigger: m(Icon, {
          name: Icons.CHEVRON_DOWN,
        }),
      }),
      vnode.state.topicEditorIsOpen && m(TopicEditor, {
        thread: vnode.attrs.proposal,
        popoverMenu: true,
        onChangeHandler: (topic: OffchainTopic) => { proposal.topic = topic; m.redraw(); },
        openStateHandler: (v) => { vnode.state.topicEditorIsOpen = v; m.redraw(); },
      }),
      vnode.state.stageEditorIsOpen && m(StageEditor, {
        thread: vnode.attrs.proposal,
        popoverMenu: true,
        onChangeHandler: (stage: OffchainThreadStage) => { proposal.stage = stage; m.redraw(); },
        openStateHandler: (v) => { vnode.state.stageEditorIsOpen = v; m.redraw(); },
      })
    ]);
  },
};

export default DiscussionRowMenu;
