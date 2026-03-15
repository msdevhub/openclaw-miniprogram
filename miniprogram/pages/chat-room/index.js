const { SLASH_COMMANDS, EMOJI_LIST } = require('../../mock/data');
const { DEFAULT_PAGE_CHROME, getPageChromeData } = require('../../utils/layout');
const {
  appendMessage,
  clearAgentUnread,
  clone,
  getConnectionState,
  getMessages,
  getPreferenceForm,
  incrementAgentUnread,
  setMessages,
  updateAgentPreview,
} = require('../../utils/app-state');
const { createGenericChannelClient, getActiveConnection } = require('../../utils/generic-channel');
const { notifyForegroundMessage } = require('../../utils/notifications');
const { redirectToScreen } = require('../../utils/routes');

const DEFAULT_THINKING_TEXT = 'OpenClaw is thinking...';

function detectMessageActions(text) {
  if (!text) return null;
  var lower = text.toLowerCase();

  // Detect /models provider list
  var providerPattern = /^\s*([\w][\w-]*)\s+\((\d+)\)\s*$/gm;
  var providers = [];
  var pm;
  while ((pm = providerPattern.exec(text)) !== null) {
    providers.push({ label: pm[1], command: '/models ' + pm[1], badge: pm[2] });
  }
  if (providers.length >= 2) {
    return { title: 'Providers', options: providers };
  }

  // Detect model switch list
  if (lower.includes('model') && (lower.includes('available') || lower.includes('current') || lower.includes('active') || lower.includes('switch'))) {
    var modelPattern = /`([^`]+\/[^`]+)`/g;
    var models = [];
    var mm;
    while ((mm = modelPattern.exec(text)) !== null) {
      var v = mm[1].trim();
      if (v.includes('/') && !v.startsWith('http') && v.length > 3) {
        models.push({ label: v.split('/').pop() || v, command: '/model ' + v, badge: '' });
      }
    }
    if (models.length >= 1) {
      return { title: 'Switch Model', options: models.slice(0, 20) };
    }
  }

  // Detect think levels
  if ((lower.includes('think') || lower.includes('reasoning')) && (lower.includes('level') || lower.includes('budget') || lower.includes('low') || lower.includes('high'))) {
    return {
      title: 'Reasoning Level',
      options: [
        { label: 'Off', command: '/think off', badge: '' },
        { label: 'Low', command: '/think low', badge: '' },
        { label: 'Medium', command: '/think medium', badge: '' },
        { label: 'High', command: '/think high', badge: '' },
      ],
    };
  }

  // Detect command list
  if ((lower.includes('/help') || lower.includes('/commands')) && lower.includes('/model') && lower.includes('/status')) {
    return {
      title: 'Quick Actions',
      options: [
        { label: 'Status', command: '/status', badge: '' },
        { label: 'Models', command: '/models', badge: '' },
        { label: 'New Session', command: '/new', badge: '' },
        { label: 'Reset', command: '/reset', badge: '' },
      ],
    };
  }

  return null;
}

function filterSlashCommands(inputValue, catalog) {
  if (!inputValue.startsWith('/')) return [];
  const query = inputValue.slice(1).trim().toLowerCase();
  if (!query) return clone(catalog);
  return catalog.filter((item) => {
    return item.label.toLowerCase().includes(`/${query}`)
      || item.desc.toLowerCase().includes(query);
  });
}

function formatMessageText(contentType, content) {
  if (contentType === 'image') return content ? `[Image] ${content}` : '[Image]';
  if (contentType === 'voice') return content ? `[Voice] ${content}` : '[Voice]';
  if (contentType === 'audio') return content ? `[Audio] ${content}` : '[Audio]';
  return content || '';
}

function normalizeHistoryMessage(entry) {
  return {
    id: entry.messageId,
    sender: entry.direction === 'sent' ? 'user' : 'ai',
    text: formatMessageText(entry.contentType, entry.content),
    reactions: [],
    contentType: entry.contentType || 'text',
    mediaUrl: entry.mediaUrl || '',
    mimeType: entry.mimeType || '',
    timestamp: entry.timestamp || Date.now(),
  };
}

function normalizeOutboundMessage(entry) {
  return {
    id: entry.messageId,
    sender: 'ai',
    text: formatMessageText(entry.contentType, entry.content),
    reactions: [],
    contentType: entry.contentType || 'text',
    mediaUrl: entry.mediaUrl || '',
    mimeType: entry.mimeType || '',
    timestamp: entry.timestamp || Date.now(),
  };
}

function normalizeInboundMessage(entry) {
  return {
    id: entry.messageId,
    sender: 'user',
    text: entry.content || '',
    reactions: [],
    contentType: entry.messageType || 'text',
    timestamp: entry.timestamp || Date.now(),
  };
}

function getConnectionMeta(status, detail) {
  switch (status) {
    case 'connected':
      return {
        text: 'Connected',
        tone: 'connected',
        detail: detail || 'Generic Channel online',
      };
    case 'connecting':
      return {
        text: 'Connecting',
        tone: 'connecting',
        detail: detail || 'Connecting to Generic Channel',
      };
    case 'reconnecting':
      return {
        text: 'Reconnecting',
        tone: 'reconnecting',
        detail: detail || 'Trying to reconnect',
      };
    default:
      return {
        text: 'Offline',
        tone: 'disconnected',
        detail: detail || 'Generic Channel offline',
      };
  }
}

Page({
  data: {
    ...DEFAULT_PAGE_CHROME,
    activeChatId: '',
    activeChat: {},
    activeConversationId: '',
    messages: [],
    inputValue: '',
    showSlashMenu: false,
    showEmojiPicker: false,
    showThinkingIndicator: false,
    thinkingText: DEFAULT_THINKING_TEXT,
    reactingToMsgId: '',
    activeBubbleId: '',
    chatScrollAnchor: '',
    slashCommandCatalog: clone(SLASH_COMMANDS),
    slashCommands: clone(SLASH_COMMANDS),
    emojiList: clone(EMOJI_LIST),
    genericSenderId: '',
    genericConnectionStatus: 'disconnected',
    genericConnectionStatusText: 'Offline',
    genericConnectionTone: 'disconnected',
    genericConnectionDetail: 'Generic Channel offline',
  },

  onLoad(options) {
    const agentId = options.agentId || 'main';
    const activeConn = getActiveConnection();

    if (!activeConn) {
      wx.showToast({ title: 'No server connected.', icon: 'none' });
      redirectToScreen('chats');
      return;
    }

    const conversationId = `openclaw-mini-agent-${agentId}-${activeConn.id}`;
    const connection = getConnectionState();

    this.setData({
      ...getPageChromeData(),
      activeChatId: agentId,
      activeChat: { id: agentId, name: agentId, isGroup: false },
      activeConversationId: conversationId,
      messages: getMessages(conversationId),
      genericSenderId: connection.senderId,
    }, () => {
      this.scrollChatToBottom();
    });

    this.genericClient = null;
    this.pageVisible = true;
    this.activeConn = activeConn;
    clearAgentUnread(agentId);
    this.connectAgentChannel(true);
  },

  onShow() {
    this.pageVisible = true;
    if (this.data.activeChatId) {
      clearAgentUnread(this.data.activeChatId);
    }
  },

  onHide() {
    this.pageVisible = false;
  },

  onUnload() {
    this.pageVisible = false;
    this.teardownGenericChannel(true);
  },

  applyConnectionStatus(payload = {}) {
    const meta = getConnectionMeta(payload.status, payload.detail);
    this.setData({
      genericConnectionStatus: payload.status || 'disconnected',
      genericConnectionStatusText: meta.text,
      genericConnectionTone: meta.tone,
      genericConnectionDetail: meta.detail,
    });
  },

  showThinkingIndicator(text) {
    this.setData({
      showThinkingIndicator: true,
      thinkingText: text || DEFAULT_THINKING_TEXT,
    }, () => {
      this.scrollChatToBottom();
    });
  },

  hideThinkingIndicator() {
    if (!this.data.showThinkingIndicator) return;
    this.setData({
      showThinkingIndicator: false,
      thinkingText: DEFAULT_THINKING_TEXT,
    });
  },

  syncMessages(messages) {
    setMessages(this.data.activeConversationId, messages);
    this.setData({ messages }, () => {
      this.scrollChatToBottom();
    });
  },

  appendLocalMessage(message) {
    const messages = appendMessage(this.data.activeConversationId, message);
    this.setData({ messages }, () => {
      this.scrollChatToBottom();
    });
    return messages;
  },

  handleSocketPacket(packet = {}) {
    switch (packet.type) {
      case 'connection.open':
        this.applyConnectionStatus({
          status: 'connected',
          detail: getPreferenceForm().genericChannelUrl,
        });
        break;
      case 'history.sync': {
        const historyMessages = Array.isArray(packet.data && packet.data.messages)
          ? packet.data.messages.map(normalizeHistoryMessage)
          : [];
        this.hideThinkingIndicator();
        this.syncMessages(historyMessages);
        if (historyMessages.length) {
          const last = historyMessages[historyMessages.length - 1];
          updateAgentPreview(this.data.activeChatId, last.text, last.timestamp);
        }
        break;
      }
      case 'message.send': {
        const nextMessage = normalizeOutboundMessage(packet.data || {});
        nextMessage.actions = detectMessageActions(nextMessage.text);
        this.hideThinkingIndicator();
        this.appendLocalMessage(nextMessage);
        updateAgentPreview(this.data.activeChatId, nextMessage.text, nextMessage.timestamp);
        if (this.pageVisible) {
          notifyForegroundMessage(`${this.data.activeChat.name || 'OpenClaw'} 有新消息`);
        } else {
          incrementAgentUnread(this.data.activeChatId, 1);
        }
        break;
      }
      case 'thinking.start':
        this.showThinkingIndicator((packet.data && packet.data.content) || DEFAULT_THINKING_TEXT);
        break;
      case 'thinking.update':
        this.showThinkingIndicator((packet.data && packet.data.content) || DEFAULT_THINKING_TEXT);
        break;
      case 'thinking.end':
        this.hideThinkingIndicator();
        break;
      default:
        break;
    }
  },

  handleSocketStatus(payload = {}) {
    this.applyConnectionStatus(payload);
  },

  handleSocketError(message) {
    this.applyConnectionStatus({
      status: this.data.genericConnectionStatus === 'connected' ? 'connected' : 'disconnected',
      detail: message || 'Socket connection failed.',
    });
  },

  connectAgentChannel(force = false) {
    const connection = getConnectionState();
    const activeConn = this.activeConn || getActiveConnection();

    if (!activeConn || !activeConn.serverUrl) {
      wx.showToast({ title: 'Please configure a server first.', icon: 'none' });
      redirectToScreen('profile');
      return;
    }

    if (this.genericClient && !force) return;
    if (this.genericClient) {
      this.genericClient.close(false);
      this.genericClient = null;
    }

    this.genericClient = createGenericChannelClient({
      serverUrl: activeConn.serverUrl,
      chatId: this.data.activeConversationId,
      chatType: 'direct',
      senderId: connection.senderId,
      senderName: activeConn.displayName || connection.senderName,
      agentId: this.data.activeChatId,
      onEvent: (packet) => this.handleSocketPacket(packet),
      onStatusChange: (payload) => this.handleSocketStatus(payload),
      onError: (message) => this.handleSocketError(message),
    });

    this.genericClient.connect(force);
  },

  teardownGenericChannel(manual = true) {
    if (this.genericClient) {
      this.genericClient.close(manual);
      this.genericClient = null;
    }

    this.hideThinkingIndicator();
    this.applyConnectionStatus({ status: 'disconnected' });
  },

  handleBack() {
    this.teardownGenericChannel(true);
    wx.navigateBack({
      delta: 1,
      fail() {
        redirectToScreen('chats');
      },
    });
  },

  handleReconnectChat() {
    wx.showToast({ title: 'Reconnecting to Generic Channel...', icon: 'none' });
    this.connectAgentChannel(true);
  },

  handleMessageInput(event) {
    const inputValue = event.detail.value || '';
    const shouldOpenSlash = inputValue.startsWith('/');
    const nextSlashCommands = shouldOpenSlash
      ? filterSlashCommands(inputValue, this.data.slashCommandCatalog)
      : clone(this.data.slashCommandCatalog);
    this.setData({
      inputValue,
      showSlashMenu: shouldOpenSlash,
      slashCommands: nextSlashCommands,
      showEmojiPicker: shouldOpenSlash ? false : this.data.showEmojiPicker,
      reactingToMsgId: shouldOpenSlash ? '' : this.data.reactingToMsgId,
    });
  },

  submitTextMessage(value) {
    const text = `${value || ''}`.trim();
    if (!text) return;

    if (!this.genericClient || !this.genericClient.isOpen()) {
      wx.showToast({ title: 'Generic Channel is not connected.', icon: 'none' });
      this.connectAgentChannel(true);
      return false;
    }

    let payload;
    try {
      payload = this.genericClient.sendText(text);
    } catch (error) {
      wx.showToast({ title: 'Generic Channel is not connected.', icon: 'none' });
      this.connectAgentChannel(true);
      return false;
    }

    const nextMessage = normalizeInboundMessage(payload);

    this.setData({
      inputValue: '',
      showSlashMenu: false,
      showEmojiPicker: false,
      slashCommands: clone(this.data.slashCommandCatalog),
      reactingToMsgId: '',
      activeBubbleId: '',
    });

    this.hideThinkingIndicator();
    this.appendLocalMessage(nextMessage);
    updateAgentPreview(this.data.activeChatId, nextMessage.text, nextMessage.timestamp);
    return true;
  },

  handleSendMessage() {
    this.submitTextMessage(this.data.inputValue);
  },

  handleToggleEmojiPicker() {
    const nextVisible = !(this.data.showEmojiPicker && !this.data.reactingToMsgId);
    this.setData({
      showEmojiPicker: nextVisible,
      showSlashMenu: false,
      reactingToMsgId: '',
      activeBubbleId: '',
    });
  },

  handleClosePanels() {
    this.setData({
      showSlashMenu: false,
      showEmojiPicker: false,
      slashCommands: clone(this.data.slashCommandCatalog),
      reactingToMsgId: '',
      activeBubbleId: '',
    });
  },

  handleSelectCommand(event) {
    const { label } = event.currentTarget.dataset;
    const needsArgs = ['/new', '/think', '/model', '/models'];
    if (needsArgs.includes(label)) {
      this.setData({
        inputValue: `${label} `,
        showSlashMenu: false,
        slashCommands: clone(this.data.slashCommandCatalog),
      });
      return;
    }
    // Send standalone commands directly
    this.setData({
      showSlashMenu: false,
      slashCommands: clone(this.data.slashCommandCatalog),
    });
    this.submitTextMessage(label);
  },

  handleBubbleSelect(event) {
    const { messageId } = event.detail;
    this.setData({
      activeBubbleId: this.data.activeBubbleId === messageId ? '' : messageId,
    });
  },

  handleOpenReactionPicker(event) {
    const { messageId } = event.detail;
    this.setData({
      showEmojiPicker: true,
      showSlashMenu: false,
      reactingToMsgId: messageId,
      activeBubbleId: messageId,
    });
  },

  handleEmojiSelect(event) {
    const { emoji } = event.detail;

    if (this.data.reactingToMsgId) {
      const messages = this.data.messages.map((message) => {
        if (message.id !== this.data.reactingToMsgId) return message;
        const reactions = Array.isArray(message.reactions) ? [...message.reactions] : [];
        const exists = reactions.includes(emoji);
        return {
          ...message,
          reactions: exists ? reactions.filter((item) => item !== emoji) : [...reactions, emoji],
        };
      });

      this.syncMessages(messages);
      this.setData({
        showEmojiPicker: false,
        reactingToMsgId: '',
        activeBubbleId: '',
      });
      return;
    }

    const nextInputValue = `${this.data.inputValue || ''}${emoji}`;
    const shouldQuickSend = !(this.data.inputValue || '').trim();

    this.setData({
      inputValue: nextInputValue,
      showEmojiPicker: false,
    }, () => {
      if (shouldQuickSend) {
        this.submitTextMessage(nextInputValue);
      }
    });
  },

  scrollChatToBottom() {
    this.setData({ chatScrollAnchor: '' });
    wx.nextTick(() => {
      this.setData({ chatScrollAnchor: 'message-end' });
    });
  },

  handleActionTap(event) {
    const { command } = event.currentTarget.dataset;
    if (command) {
      this.submitTextMessage(command);
    }
  },
});
