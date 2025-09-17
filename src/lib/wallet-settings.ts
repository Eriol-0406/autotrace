/**
 * Wallet connection preferences and utilities
 */

export class WalletSettings {
  /**
   * Enable manual wallet selection mode - user must choose wallet every time
   */
  static enableManualSelection(): void {
    localStorage.setItem('forceManualWalletSelection', 'true');
    console.log('🎯 Manual wallet selection enabled - you will choose your wallet every time');
  }

  /**
   * Disable manual wallet selection mode - allow auto-reconnection within same session
   */
  static enableAutoReconnect(): void {
    localStorage.setItem('forceManualWalletSelection', 'false');
    console.log('🔄 Auto-reconnection enabled - wallet will reconnect within same session');
  }

  /**
   * Check if manual wallet selection is enabled
   */
  static isManualSelectionEnabled(): boolean {
    return localStorage.getItem('forceManualWalletSelection') === 'true';
  }

  /**
   * Clear all wallet memory (both session and persistent)
   */
  static clearAllWalletMemory(): void {
    localStorage.removeItem('walletManuallyDisconnected');
    localStorage.removeItem('forceManualWalletSelection');
    sessionStorage.removeItem('lastConnectedWallet');
    console.log('🧹 All wallet memory cleared');
  }

  /**
   * Get current wallet connection preference
   */
  static getCurrentPreference(): 'manual' | 'auto-session' {
    return this.isManualSelectionEnabled() ? 'manual' : 'auto-session';
  }
}

// Export for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).WalletSettings = WalletSettings;
}
