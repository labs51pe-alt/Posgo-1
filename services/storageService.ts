import { UserProfile, Product, Transaction, Purchase, StoreSettings, Customer, Supplier, CashShift, CashMovement } from '../types';
import { MOCK_PRODUCTS, DEFAULT_SETTINGS } from '../constants';
import { supabase } from './supabase';

const KEYS = {
  SESSION: 'lumina_session',
  PRODUCTS: 'lumina_products',
  TRANSACTIONS: 'lumina_transactions',
  PURCHASES: 'lumina_purchases',
  SETTINGS: 'lumina_settings',
  CUSTOMERS: 'lumina_customers',
  SUPPLIERS: 'lumina_suppliers',
  SHIFTS: 'lumina_shifts',
  MOVEMENTS: 'lumina_movements',
  ACTIVE_SHIFT_ID: 'lumina_active_shift'
};

// Helper to check if we are in DEMO mode or REAL mode
const isDemo = () => {
    const session = localStorage.getItem(KEYS.SESSION);
    if (!session) return true;
    const user = JSON.parse(session);
    // Demo user or explicit local-only user
    return user.id === 'test-user-demo'; 
};

// Cache for store_id to avoid repeated fetches
let cachedStoreId: string | null = null;

const getStoreId = async (): Promise<string | null> => {
    if (isDemo()) return null;
    if (cachedStoreId) return cachedStoreId;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('profiles').select('store_id').eq('id', user.id).single();
    if (data) {
        cachedStoreId = data.store_id;
        return data.store_id;
    }
    return null;
};

export const StorageService = {
  // === AUTH ===
  saveSession: (user: UserProfile) => localStorage.setItem(KEYS.SESSION, JSON.stringify(user)),
  getSession: (): UserProfile | null => {
    const s = localStorage.getItem(KEYS.SESSION);
    return s ? JSON.parse(s) : null;
  },
  clearSession: async () => {
    localStorage.removeItem(KEYS.SESSION);
    cachedStoreId = null;
    await supabase.auth.signOut();
  },

  // === PRODUCTS ===
  getProducts: async (): Promise<Product[]> => {
    if (isDemo()) {
        const s = localStorage.getItem(KEYS.PRODUCTS);
        return s ? JSON.parse(s) : MOCK_PRODUCTS;
    } else {
        const { data, error } = await supabase.from('products').select('*');
        if (error || !data) return [];
        return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category,
            stock: Number(p.stock),
            barcode: p.barcode,
            hasVariants: p.variants && p.variants.length > 0,
            variants: p.variants || [],
            image: p.image_url
        }));
    }
  },
  saveProducts: async (products: Product[]) => {
    if (isDemo()) {
        localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    } else {
        const storeId = await getStoreId();
        if (!storeId) return;

        for (const p of products) {
            const payload: any = {
                name: p.name,
                price: p.price,
                stock: p.stock,
                category: p.category,
                barcode: p.barcode,
                variants: p.variants,
                store_id: storeId
            };
            if (p.id) payload.id = p.id; 

            const { error } = await supabase.from('products').upsert(payload);
            if (error) console.error('Error saving product', error);
        }
    }
  },

  // === TRANSACTIONS ===
  getTransactions: async (): Promise<Transaction[]> => {
    if (isDemo()) {
        const s = localStorage.getItem(KEYS.TRANSACTIONS);
        return s ? JSON.parse(s) : [];
    } else {
        const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (error || !data) return [];
        return data.map((t: any) => ({
            id: t.id,
            date: t.date,
            items: t.items,
            subtotal: Number(t.subtotal),
            tax: Number(t.tax),
            discount: Number(t.discount),
            total: Number(t.total),
            paymentMethod: t.payment_method,
            payments: t.payments,
            profit: Number(t.profit),
            shiftId: t.shift_id
        }));
    }
  },
  saveTransaction: async (transaction: Transaction) => {
    if (isDemo()) {
        const current = await StorageService.getTransactions();
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([transaction, ...current]));
    } else {
        const storeId = await getStoreId();
        if (!storeId) return;

        const { error } = await supabase.from('transactions').insert({
            id: transaction.id,
            shift_id: transaction.shiftId,
            store_id: storeId,
            total: transaction.total,
            subtotal: transaction.subtotal,
            tax: transaction.tax,
            discount: transaction.discount,
            items: transaction.items,
            payments: transaction.payments,
            payment_method: transaction.paymentMethod,
            date: transaction.date
        });
        if (error) console.error("Error saving transaction", error);
    }
  },

  // === PURCHASES ===
  getPurchases: async (): Promise<Purchase[]> => {
    const s = localStorage.getItem(KEYS.PURCHASES);
    return s ? JSON.parse(s) : [];
  },
  savePurchase: async (purchase: Purchase) => {
    const current = await StorageService.getPurchases();
    localStorage.setItem(KEYS.PURCHASES, JSON.stringify([purchase, ...current]));
  },

  // === SETTINGS ===
  getSettings: async (): Promise<StoreSettings> => {
    if (isDemo()) {
        const s = localStorage.getItem(KEYS.SETTINGS);
        return s ? JSON.parse(s) : DEFAULT_SETTINGS;
    } else {
        const storeId = await getStoreId();
        if (!storeId) return DEFAULT_SETTINGS;

        const { data } = await supabase.from('stores').select('settings').eq('id', storeId).single();
        return data?.settings || DEFAULT_SETTINGS;
    }
  },
  saveSettings: async (settings: StoreSettings) => {
    if (isDemo()) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } else {
        const storeId = await getStoreId();
        if (storeId) {
             await supabase.from('stores').update({ settings }).eq('id', storeId);
        }
    }
  },

  // === CUSTOMERS ===
  getCustomers: async (): Promise<Customer[]> => {
    if (isDemo()) {
        const s = localStorage.getItem(KEYS.CUSTOMERS);
        return s ? JSON.parse(s) : [];
    } else {
        const { data } = await supabase.from('customers').select('*');
        return data || [];
    }
  },
  
  // === SUPPLIERS ===
  getSuppliers: (): Supplier[] => {
    const s = localStorage.getItem(KEYS.SUPPLIERS);
    return s ? JSON.parse(s) : [];
  },
  saveSupplier: (supplier: Supplier) => {
    const current = JSON.parse(localStorage.getItem(KEYS.SUPPLIERS) || '[]');
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify([...current, supplier]));
  },

  // === SHIFTS ===
  getShifts: async (): Promise<CashShift[]> => {
    if (isDemo()) {
        const s = localStorage.getItem(KEYS.SHIFTS);
        return s ? JSON.parse(s) : [];
    } else {
        const { data } = await supabase.from('cash_shifts').select('*').order('created_at', { ascending: false });
        if (!data) return [];
        return data.map((s: any) => ({
            id: s.id,
            startTime: s.start_time,
            endTime: s.end_time,
            startAmount: Number(s.start_amount),
            endAmount: Number(s.end_amount),
            status: s.status,
            totalSalesCash: Number(s.total_sales_cash),
            totalSalesDigital: Number(s.total_sales_digital)
        }));
    }
  },
  saveShift: async (shift: CashShift) => {
    if (isDemo()) {
        const shifts = await StorageService.getShifts();
        const idx = shifts.findIndex(s => s.id === shift.id);
        if (idx >= 0) shifts[idx] = shift;
        else shifts.unshift(shift);
        localStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
    } else {
         const storeId = await getStoreId();
         if (!storeId) return;

         const payload: any = {
             id: shift.id,
             start_time: shift.startTime,
             end_time: shift.endTime,
             start_amount: shift.startAmount,
             end_amount: shift.endAmount,
             status: shift.status,
             total_sales_cash: shift.totalSalesCash,
             total_sales_digital: shift.totalSalesDigital,
             store_id: storeId
         };
         await supabase.from('cash_shifts').upsert(payload);
    }
  },
  
  // === MOVEMENTS ===
  getMovements: async (): Promise<CashMovement[]> => {
      if (isDemo()) {
          const s = localStorage.getItem(KEYS.MOVEMENTS);
          return s ? JSON.parse(s) : [];
      } else {
           const { data } = await supabase.from('cash_movements').select('*');
           if (!data) return [];
           return data.map((m: any) => ({
               id: m.id,
               shiftId: m.shift_id,
               type: m.type,
               amount: Number(m.amount),
               description: m.description,
               timestamp: m.timestamp
           }));
      }
  },
  saveMovement: async (movement: CashMovement) => {
      if (isDemo()) {
          const moves = await StorageService.getMovements();
          localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify([...moves, movement]));
      } else {
          const storeId = await getStoreId();
          if (!storeId) return;

          await supabase.from('cash_movements').insert({
              id: movement.id,
              shift_id: movement.shiftId,
              store_id: storeId,
              type: movement.type,
              amount: movement.amount,
              description: movement.description,
              timestamp: movement.timestamp
          });
      }
  },

  getActiveShiftId: (): string | null => {
      return localStorage.getItem(KEYS.ACTIVE_SHIFT_ID);
  },
  setActiveShiftId: (id: string | null) => {
      if(id) localStorage.setItem(KEYS.ACTIVE_SHIFT_ID, id);
      else localStorage.removeItem(KEYS.ACTIVE_SHIFT_ID);
  },

  resetDemoData: () => {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(KEYS.PURCHASES, JSON.stringify([]));
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify([]));
      localStorage.setItem(KEYS.MOVEMENTS, JSON.stringify([]));
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([]));
      localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify([]));
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.removeItem(KEYS.ACTIVE_SHIFT_ID);
  }
};