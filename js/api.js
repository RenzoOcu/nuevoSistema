/**
 * js/api.js
 * External integration stubs — prepared for n8n / Webhook / REST API
 *
 * To enable real notifications:
 *  1. Set WEBHOOK_URL to your n8n or custom endpoint
 *  2. Uncomment the fetch() calls
 *  3. Handle CORS on your server if needed
 */

const API = {
  WEBHOOK_URL: '', // e.g. 'https://your-n8n.io/webhook/listo-alerts'
  ENABLED: false,   // flip to true when ready

  /**
   * Notify external system when a product becomes expired or near-expiry.
   * Called automatically by the app engine on status changes.
   * @param {Object} product - the full product object
   * @param {'expired'|'expiring'} alertType
   */
  async sendAlert(product, alertType) {
    if (!this.ENABLED || !this.WEBHOOK_URL) return;
    try {
      await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'INVENTORY_ALERT',
          type: alertType,
          product: {
            id: product.id,
            name: product.name,
            category: product.category,
            stock: product.stock,
            expiryDate: product.expiryDate,
            daysRemaining: product._daysRemaining,
          },
          timestamp: new Date().toISOString(),
          source: 'listo-minimarket-pos',
        }),
      });
    } catch (err) {
      console.warn('[API] Alert send failed:', err);
    }
  },

  /**
   * Notify external system when a product is added or edited (for sync).
   * @param {Object} product
   * @param {'created'|'updated'|'deleted'} action
   */
  async syncProduct(product, action) {
    if (!this.ENABLED || !this.WEBHOOK_URL) return;
    try {
      await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'PRODUCT_SYNC',
          action,
          product,
          timestamp: new Date().toISOString(),
          source: 'listo-minimarket-pos',
        }),
      });
    } catch (err) {
      console.warn('[API] Sync failed:', err);
    }
  },
};
