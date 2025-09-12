import { initDb, upsertTransactions, getBanks, getTransactionsForBanks, deleteBank as dbDeleteBank } from '@/lib/lokiDb';
interface Transaction {
  date: string;
  refId: string;
  amount: number;
  type: 'deposit' | 'withdrawl';
  closingBy: number;
  category: string;
  tags: string;
}

interface BankData {
  bankName: string;
  transactions: Transaction[];
}

export class BankDataService {
  private static instance: BankDataService;
  private availableBanks: string[] = [];
  private isLoaded = false;
  private readonly LOCAL_STORAGE_KEY = 'bankData';
  private changeListeners: Set<() => void> = new Set();

  private constructor() {}

  static getInstance(): BankDataService {
    if (!BankDataService.instance) {
      BankDataService.instance = new BankDataService();
    }
    return BankDataService.instance;
  }

  async loadBankData(): Promise<void> {
    if (this.isLoaded) {
      return;
    }
    await initDb();
    // Dynamically load any files matching *Transaction.json under src/data
    // Vite will statically include matching files in the build.
    const modules = import.meta.glob('../data/*Transaction.json', { eager: true });

    Object.keys(modules).forEach((path) => {
      const match = /\/([A-Za-z0-9_-]+)Transaction\.json$/.exec(path);
      if (!match) return;
      const bankCode = match[1].toLowerCase();
      const mod = modules[path] as { default: Transaction[] } | unknown;
      const transactions = (mod as any).default as Transaction[] | undefined;
      if (!transactions) return;
      // Seed static bundled data into Loki (idempotent due to upsert)
      void upsertTransactions(bankCode, transactions.map(t => ({
        refId: t.refId,
        date: t.date,
        amount: t.amount,
        type: t.type,
        closingBy: t.closingBy,
        category: t.category,
        tags: t.tags,
      })));
    });

    // One-time migration from legacy localStorage format to Loki
    this.migrateFromLocalStorage();

    // Refresh available banks from DB
    this.availableBanks = await getBanks();
    this.isLoaded = true;
    this.notifyChange();
  }

  getAvailableBanks(): string[] {
    return this.availableBanks;
  }

  getBankData(bankName: string): Transaction[] {
    // Synchronous wrapper calling async is not ideal, but existing API is sync.
    // Consumers should use the hook which awaits loadBankData first.
    // Here we return empty immediately; hook will refresh on change.
    console.warn('getBankData should be used after loadBankData resolves. Returning empty until DB ready.');
    // This method is kept for backward compatibility; use getFilteredTransactions via hook.
    return [];
  }

  getAllTransactions(): Transaction[] {
    console.warn('getAllTransactions should be used after loadBankData resolves. Returning empty until DB ready.');
    return [];
  }

  getFilteredTransactions(banks: string[], startDate?: Date, endDate?: Date): Transaction[] {
    // This method is expected to be called within render from the hook, so we cannot await.
    // The hook calls this right after ensuring loadBankData has run; we can store last fetched cache
    // but simplest is to rely on the hook to compute from async data. Here, return [] to avoid blocking.
    console.warn('getFilteredTransactions should be derived from async DB results in the hook. Returning empty.');
    return [];
  }

  addOrReplaceBank(bankName: string, transactions: Transaction[]): void {
    const bankCode = bankName.toLowerCase();
    void (async () => {
      await upsertTransactions(bankCode, transactions.map(t => ({
        refId: t.refId,
        date: t.date,
        amount: t.amount,
        type: t.type,
        closingBy: t.closingBy,
        category: t.category,
        tags: t.tags,
      })));
      this.availableBanks = await getBanks();
      this.notifyChange();
    })();
  }

  removeBank(bankName: string): void {
    const bankCode = bankName.toLowerCase();
    void (async () => {
      await dbDeleteBank(bankCode);
      this.availableBanks = await getBanks();
      this.notifyChange();
    })();
  }

  onChange(listener: () => void): void {
    this.changeListeners.add(listener);
  }

  offChange(listener: () => void): void {
    this.changeListeners.delete(listener);
  }

  private notifyChange(): void {
    this.changeListeners.forEach((l) => {
      try { l(); } catch {}
    });
  }

  private migrateFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, Transaction[] | Record<string, Transaction>>;
      const tasks: Promise<any>[] = [];
      Object.entries(parsed).forEach(([bank, value]) => {
        const list: Transaction[] = Array.isArray(value)
          ? value as Transaction[]
          : Object.values(value || {}) as Transaction[];
        if (list.length === 0) return;
        tasks.push(upsertTransactions(bank, list.map(t => ({
          refId: t.refId,
          date: t.date,
          amount: t.amount,
          type: t.type,
          closingBy: t.closingBy,
          category: t.category,
          tags: t.tags,
        }))));
      });
      Promise.all(tasks).finally(() => {
        try { localStorage.removeItem(this.LOCAL_STORAGE_KEY); } catch {}
      });
    } catch {
      // Ignore
    }
  }
}

export const bankDataService = BankDataService.getInstance();