import Loki from 'lokijs';

export interface BankTxn {
  bank: string;
  refId: string;
  date: string;
  amount: number;
  type: 'deposit' | 'withdrawl';
  closingBy: number;
  category: string;
  tags: string;
  $loki?: number;
  meta?: unknown;
}

const DB_NAME = 'dashwiz-folio-db';
const TXN_COLLECTION = 'transactions';

let db: Loki | null = null;
let isInitializing = false;
let initPromise: Promise<void> | null = null;

function getPersistenceAdapter() {
  try {
    const AnyLoki = Loki as any;
    if (typeof window !== 'undefined' && AnyLoki && AnyLoki.LokiLocalStorageAdapter) {
      return new AnyLoki.LokiLocalStorageAdapter();
    }
  } catch {}
  return undefined;
}

export async function initDb(): Promise<void> {
  if (db) return;
  if (isInitializing && initPromise) return initPromise;
  isInitializing = true;
  initPromise = new Promise((resolve) => {
    db = new Loki(DB_NAME, {
      autoload: true,
      autoloadCallback: () => {
        let col = db!.getCollection<BankTxn>(TXN_COLLECTION);
        if (!col) {
          col = db!.addCollection<BankTxn>(TXN_COLLECTION, {
            unique: ['refId_bank'],
            indices: ['bank', 'date', 'refId'],
          } as any);
        }
        resolve();
      },
      autosave: true,
      autosaveInterval: 2000,
      adapter: getPersistenceAdapter(),
    });
  });
  await initPromise;
  isInitializing = false;
}

export function isDbReady(): boolean {
  if (!db) return false;
  return !!db.getCollection(TXN_COLLECTION);
}

function getCollection() {
  if (!db) {
    throw new Error('Loki DB not initialized');
  }
  let col = db.getCollection<BankTxn>(TXN_COLLECTION);
  if (!col) {
    col = db.addCollection<BankTxn>(TXN_COLLECTION, {
      unique: ['refId_bank'],
      indices: ['bank', 'date', 'refId'],
    } as any);
  }
  return col;
}

export async function upsertTransactions(bank: string, txns: Omit<BankTxn, 'bank'>[]): Promise<{ inserted: number; updated: number; total: number; }>{
  await initDb();
  const col = getCollection();
  let inserted = 0;
  let updated = 0;
  for (const t of txns) {
    const key = `${bank}__${t.refId}`;
    // Store composite key on the doc to use as unique
    const existing = col.findOne({ refId_bank: key } as any);
    const doc: BankTxn = { ...t, bank, refId: t.refId, } as BankTxn;
    (doc as any).refId_bank = key;
    if (existing) {
      // Preserve $loki/meta
      doc.$loki = (existing as any).$loki;
      doc.meta = (existing as any).meta;
      col.update({ ...(existing as any), ...doc });
      updated++;
    } else {
      col.insert(doc as any);
      inserted++;
    }
  }
  db!.saveDatabase();
  return { inserted, updated, total: col.count() };
}

export async function getBanks(): Promise<string[]> {
  await initDb();
  const col = getCollection();
  const banks = new Set<string>();
  col.find().forEach(d => banks.add(d.bank));
  return Array.from(banks).sort();
}

export function getBanksSync(): string[] {
  if (!db) return [];
  const col = getCollection();
  const banks = new Set<string>();
  col.find().forEach(d => banks.add(d.bank));
  return Array.from(banks).sort();
}

export async function getTransactionsForBanks(banks: string[]): Promise<BankTxn[]> {
  await initDb();
  const col = getCollection();
  if (banks.includes('all-banks')) {
    return col
      .chain()
      .simplesort('date', true)
      .data();
  }
  return col
    .chain()
    .find({ bank: { '$in': banks } } as any)
    .simplesort('date', true)
    .data();
}

export function getTransactionsForBanksSync(banks: string[]): BankTxn[] {
  if (!db) return [];
  const col = getCollection();
  if (banks.includes('all-banks')) {
    return col.chain().simplesort('date', true).data();
  }
  return col.chain().find({ bank: { '$in': banks } } as any).simplesort('date', true).data();
}

export async function deleteBank(bank: string): Promise<number> {
  await initDb();
  const col = getCollection();
  const toRemove = col.chain().find({ bank } as any).data();
  toRemove.forEach((doc) => col.remove(doc));
  db!.saveDatabase();
  return toRemove.length;
}


