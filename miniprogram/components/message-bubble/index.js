const { parseMarkdown } = require('../../utils/markdown');

Component({
  properties: {
    message: {
      type: Object,
      value: {},
    },
    agentEmoji: {
      type: String,
      value: '🤖',
    },
    isActive: {
      type: Boolean,
      value: false,
    },
    delay: {
      type: Number,
      value: 0,
    },
  },
  observers: {
    'message.text, message.sender': function (text, sender) {
      if (sender !== 'user' && text) {
        this.setData({ mdNodes: parseMarkdown(text) });
      } else {
        this.setData({ mdNodes: [] });
      }
    },
  },
  data: {
    mdNodes: [],
  },
  methods: {
    handleBubbleTap() {
      this.triggerEvent('select', { messageId: this.properties.message.id });
    },
    handleLongPress() {
      this.triggerEvent('reaction', { messageId: this.properties.message.id });
    },
    handleReactionTap() {
      this.triggerEvent('reaction', { messageId: this.properties.message.id });
    },
    handleLinkTap(event) {
      const href = event.currentTarget.dataset.href;
      if (href) {
        wx.setClipboardData({ data: href });
        wx.showToast({ title: 'Link copied', icon: 'none' });
      }
    },
  },
});
