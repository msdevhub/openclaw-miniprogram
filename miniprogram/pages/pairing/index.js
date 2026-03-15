const { DEFAULT_PAGE_CHROME, getPageChromeData } = require('../../utils/layout');
const { getConnectionState, getPreferenceForm, saveConnectionState, updatePreferenceForm } = require('../../utils/app-state');
const { navigateToScreen } = require('../../utils/routes');
const { addServerConnection, setActiveConnectionId } = require('../../utils/generic-channel');

Page({
  data: {
    ...DEFAULT_PAGE_CHROME,
    preferenceForm: getPreferenceForm(),
    genericSenderId: '',
  },

  onLoad() {
    const connection = getConnectionState();
    this.setData({
      ...getPageChromeData(),
      preferenceForm: getPreferenceForm(),
      genericSenderId: connection.senderId,
    });
  },

  handleBack() {
    wx.navigateBack({
      delta: 1,
      fail() {
        navigateToScreen('profile');
      },
    });
  },

  handleInput(event) {
    const { field } = event.currentTarget.dataset;
    const value = event.detail.value || '';
    const nextForm = {
      ...this.data.preferenceForm,
      [field]: value,
    };
    updatePreferenceForm(nextForm);
    this.setData({
      preferenceForm: nextForm,
    });
  },

  handlePairConnection() {
    const displayName = (this.data.preferenceForm.displayName || '').trim();
    const serverUrl = (this.data.preferenceForm.genericChannelUrl || '').trim();
    const token = (this.data.preferenceForm.token || '').trim();
    const chatId = (this.data.preferenceForm.chatId || '').trim();
    const senderId = (this.data.preferenceForm.senderId || '').trim();

    if (!displayName) {
      wx.showToast({ title: 'Display name is required.', icon: 'none' });
      return;
    }

    if (!serverUrl) {
      wx.showToast({ title: 'WebSocket URL is required.', icon: 'none' });
      return;
    }

    saveConnectionState({
      displayName,
      serverUrl,
      isPaired: true,
    });

    const conn = addServerConnection(displayName, serverUrl, displayName, token, chatId, senderId);
    setActiveConnectionId(conn.id);

    updatePreferenceForm({
      ...this.data.preferenceForm,
      displayName,
      genericChannelUrl: serverUrl,
    });

    wx.showToast({ title: 'Server connected!', icon: 'none' });
    navigateToScreen('chats');
  },
});
