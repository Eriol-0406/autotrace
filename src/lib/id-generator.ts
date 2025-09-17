/**
 * ID Generator Utility - Ensures consistent ID format across the system
 * This prevents dummy data and ensures proper ID formatting
 */

class IDGenerator {
  private static shipmentCounter = 1;
  private static transactionCounter = 1;
  private static partCounter = 1;

  /**
   * Generate shipment ID in format: SHP-001
   */
  static generateShipmentId(): string {
    const id = `SHP-${String(this.shipmentCounter).padStart(3, '0')}`;
    this.shipmentCounter++;
    return id;
  }

  /**
   * Generate transaction ID in format: T-001
   */
  static generateTransactionId(): string {
    const id = `T-${String(this.transactionCounter).padStart(3, '0')}`;
    this.transactionCounter++;
    return id;
  }

  /**
   * Generate part ID in format: P-001
   */
  static generatePartId(): string {
    const id = `P-${String(this.partCounter).padStart(3, '0')}`;
    this.partCounter++;
    return id;
  }

  /**
   * Initialize counters from database to avoid conflicts
   * This should be called on app startup
   */
  static async initializeCounters(): Promise<void> {
    try {
      // Import database service here to avoid circular dependencies
      const { databaseService } = await import('./database');
      
      // Get the highest existing IDs and set counters accordingly
      const shipments = await databaseService.getShipments('', true);
      const transactions = await databaseService.getTransactions('', true);
      const parts = await databaseService.getParts('', true);

      // Extract numeric parts and find maximum
      const shipmentNumbers = shipments
        .map(s => parseInt(s.id.replace('SHP-', '')))
        .filter(n => !isNaN(n));
      
      const transactionNumbers = transactions
        .map(t => parseInt(t.id.replace('T-', '')))
        .filter(n => !isNaN(n));
      
      const partNumbers = parts
        .map(p => parseInt(p.id.replace('P-', '')))
        .filter(n => !isNaN(n));

      // Set counters to max + 1
      this.shipmentCounter = Math.max(0, ...shipmentNumbers) + 1;
      this.transactionCounter = Math.max(0, ...transactionNumbers) + 1;
      this.partCounter = Math.max(0, ...partNumbers) + 1;

      console.log(`🔢 ID counters initialized: SHP-${this.shipmentCounter}, T-${this.transactionCounter}, P-${this.partCounter}`);
    } catch (error) {
      console.error('Error initializing ID counters:', error);
      // Continue with default counters if initialization fails
    }
  }

  /**
   * Reset counters (for testing purposes)
   */
  static resetCounters(): void {
    this.shipmentCounter = 1;
    this.transactionCounter = 1;
    this.partCounter = 1;
  }
}

export default IDGenerator;
