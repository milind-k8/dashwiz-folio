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

  private constructor() {}

  static getInstance(): BankDataService {
    if (!BankDataService.instance) {
      BankDataService.instance = new BankDataService();
    }
    return BankDataService.instance;
  }

  async loadBankData(): Promise<void> {
    // Load HDFC data directly since we know it exists
    try {
      const hdfcModule = await import('../data/hdfcTransaction.json');
      this.bankData.set('hdfc', hdfcModule.default as Transaction[]);
      this.availableBanks.push('hdfc');
    } catch (error) {
      console.error('Error loading HDFC data:', error);
    }

    // Try to load other bank files from public folder
    const bankFiles = [
      { file: 'citiBankTransaction.json', name: 'citi' },
      { file: 'chaseBankTransaction.json', name: 'chase' },
      { file: 'bofaTransaction.json', name: 'bofa' },
      { file: 'wellsTransaction.json', name: 'wells' },
      { file: 'capitalOneTransaction.json', name: 'capital' }
    ];

    for (const bank of bankFiles) {
      try {
        const response = await fetch(`/${bank.file}`);
        if (response.ok) {
          const transactions = await response.json() as Transaction[];
          this.bankData.set(bank.name, transactions);
          this.availableBanks.push(bank.name);
        }
      } catch (error) {
        // File doesn't exist, skip silently
      }
    }
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