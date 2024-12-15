import { JetStreamClient } from "@nats-io/jetstream";
import { KV, Kvm } from "@nats-io/kv";

/**
 * Class that uses the nats-io library for accessing and using the KV store.
 */
export class CustomKVM {
  private kvManager: Kvm | undefined;
  private kvStores: Map<string, KV> = new Map();
  constructor() {}

  /**
   * Initialize connection and create a manager object to handle CRUD of streams and consumers
   */
  public async init(jetstreamClient: JetStreamClient): Promise<void> {
    this.kvManager = new Kvm(jetstreamClient);
  }

  /**
   * Creates and opens the specified KV. If the KV already exists, it opens the existing KV.
   */
  public async createStore(store: string) {
    if (this.kvManager) {
      const kv = await this.kvManager.create(store);
      this.kvStores.set(store, kv);
    }
  }

  /**
   * Returns the KvEntry stored under the key if it exists or null if not.
   */
  public async getEntry(store: string, key: string) {
    const kvStore = this.kvStores.get(store);
    if(kvStore) {
        return kvStore.get(key)  
    }
  }

  /**
   * Sets or updates the value stored under the specified key.
   */
  public async putEntry(store: string, key: string, value: any) {
    const kvStore = this.kvStores.get(store);
    if(kvStore) {
        return kvStore.put(key, JSON.stringify(value));
    }
  }

  /**
   * Deletes and purges the specified key and any value.
   */
  public async deleteEntry(store: string, key: string) {
    const kvStore = this.kvStores.get(store);
    if(kvStore) {
        return kvStore.delete(key);
    }
  }

  /**
   * Deletes and purges the specified key and any value history.
   */
  public async purgeEntry(store: string, key: string) {
    const kvStore = this.kvStores.get(store);
    if(kvStore) {
        return kvStore.purge(key);
    }
  }
}
