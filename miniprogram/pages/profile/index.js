const { getNavItems } = require('../../utils/navigation');
const { DEFAULT_PAGE_CHROME, getPageChromeData } = require('../../utils/layout');
const {
  getPreferenceForm,
  getProfileGroups,
  getTotalUnread,
  toggleProfileGroupSetting,
} = require('../../utils/app-state');
const { requestMessageSubscription } = require('../../utils/notifications');
const { navigateToScreen, redirectToScreen } = require('../../utils/routes');
const {
  getServerConnections,
  removeServerConnection,
  getActiveConnectionId,
  setActiveConnectionId,
} = require('../../utils/generic-channel');

Page({
  data: {
    ...DEFAULT_PAGE_CHROME,
    navItems: getNavItems(0),
    currentScreen: 'profile',
    preferenceForm: getPreferenceForm(),
    profileGroups: getProfileGroups(),
    servers: [],
    activeServerId: '',
  },

  onLoad() {
    this.setData({
      ...getPageChromeData(),
      navItems: getNavItems(getTotalUnread()),
    });
  },

  onShow() {
    const preferenceForm = getPreferenceForm();
    this.setData({
      preferenceForm,
      profileGroups: getProfileGroups(),
      servers: getServerConnections(),
      activeServerId: getActiveConnectionId(),
      navItems: getNavItems(getTotalUnread()),
    });
  },

  handleNavigate(event) {
    const { screen } = event.detail;
    if (!screen || screen === this.data.currentScreen) return;
    redirectToScreen(screen);
  },

  handleToggleSetting(event) {
    const { key } = event.detail;
    toggleProfileGroupSetting(key);
    this.setData({ profileGroups: getProfileGroups() });
  },

  handleSettingTap(event) {
    const { navigateTo } = event.detail;
    if (navigateTo) {
      navigateToScreen(navigateTo);
      return;
    }
    wx.showToast({ title: 'This setting is a static demo item.', icon: 'none' });
  },

  handleAddServer() {
    navigateToScreen('pairing');
  },

  handleActivateServer(event) {
    const id = event.currentTarget.dataset.id;
    setActiveConnectionId(id);
    this.setData({ activeServerId: id });
    wx.showToast({ title: 'Server activated', icon: 'none' });
  },

  handleRemoveServer(event) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: 'Remove Server',
      content: 'Remove this server connection?',
      success: (res) => {
        if (res.confirm) {
          removeServerConnection(id);
          this.setData({
            servers: getServerConnections(),
            activeServerId: getActiveConnectionId(),
          });
        }
      },
    });
  },

  handleLogout() {
    wx.showToast({ title: 'Log out is mocked in this build.', icon: 'none' });
  },

  handleEnableNotifications() {
    requestMessageSubscription();
  },
});
