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
  private bankData: Map<string, Transaction[]> = new Map();
  private availableBanks: string[] = [];
  private isLoaded = false;

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

      this.bankData.set(bankCode, transactions);
      if (!this.availableBanks.includes(bankCode)) {
        this.availableBanks.push(bankCode);
      }
    });

    this.isLoaded = true;
  }

  getAvailableBanks(): string[] {
    return this.availableBanks;
  }

  getBankData(bankName: string): Transaction[] {
    return this.bankData.get(bankName) || [];
  }

  getAllTransactions(): Transaction[] {
    const allTransactions: Transaction[] = [];
    this.bankData.forEach(transactions => {
      allTransactions.push(...transactions);
    });
    return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getFilteredTransactions(banks: string[], startDate?: Date, endDate?: Date): Transaction[] {
    let transactions: Transaction[] = [];
    
    if (banks.includes('all-banks')) {
      transactions = this.getAllTransactions();
    } else {
      banks.forEach(bank => {
        transactions.push(...this.getBankData(bank));
      });
    }

    if (startDate && endDate) {
      transactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const bankDataService = BankDataService.getInstance();