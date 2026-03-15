const { getNavItems } = require('../../utils/navigation');
const { DEFAULT_PAGE_CHROME, getPageChromeData } = require('../../utils/layout');
const { getQuickFilters, getRecentSearches, getTotalUnread } = require('../../utils/app-state');
const { redirectToScreen } = require('../../utils/routes');

Page({
  data: {
    ...DEFAULT_PAGE_CHROME,
    navItems: getNavItems(0),
    currentScreen: 'search',
    searchScreenQuery: '',
    recentSearches: getRecentSearches(),
    quickFilters: getQuickFilters(),
  },

  onLoad() {
    this.setData({
      ...getPageChromeData(),
      navItems: getNavItems(getTotalUnread()),
      recentSearches: getRecentSearches(),
      quickFilters: getQuickFilters(),
    });
  },

  onShow() {
    this.setData({
      navItems: getNavItems(getTotalUnread()),
    });
  },

  handleNavigate(event) {
    const { screen } = event.detail;
    if (!screen || screen === this.data.currentScreen) return;
    redirectToScreen(screen);
  },

  handleSearchInput(event) {
    this.setData({
      searchScreenQuery: event.detail.value || '',
    });
  },

  handleSearchShortcut(event) {
    const { label } = event.currentTarget.dataset;
    this.setData({
      searchScreenQuery: label,
    });
  },
});
