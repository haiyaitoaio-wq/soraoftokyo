import { Product } from './types';

export type NewProductPayload = Omit<Product, 'id' | 'imageUrl'>;
export type UpdatableProductData = Partial<Omit<Product, 'id'>>;

const STORAGE_KEY = 'letra-products-storage';

// This is the initial data that seeds the storage if it's empty.
const initialProducts: Product[] = [
  { id: 1, code: 'SKU-001', name: 'オーガニックコットンTシャツ', name2: '半袖', sizeCode: 'M', imageUrl: '' },
  { id: 2, code: 'SKU-002', name: 'リネンブレンドパンツ', name2: 'アンクル丈', sizeCode: 'L', imageUrl: '' },
  { id: 3, code: 'SKU-003', name: 'シルクカシミヤセーター', name2: '', sizeCode: 'S', imageUrl: '' },
  { id: 4, code: 'ACC-001', name: 'レザーベルト', name2: 'バックル', sizeCode: 'FREE', imageUrl: '' },
  { id: 5, code: 'ACC-002', name: 'ウールマフラー', name2: '', sizeCode: '', imageUrl: '' },
  { id: 6, code: 'BG-010', name: 'BAG ROMBO', name2: 'BLK XS', sizeCode: 'XS', imageUrl: '' },
];

/**
 * NOTE: This is a mock API using localStorage to persist data in the browser.
 * In a real-world application, this would be replaced with actual HTTP requests
 * to a backend server to allow data synchronization across devices.
 */

const simulateNetworkDelay = () => new Promise(res => setTimeout(res, Math.random() * 200 + 50));

const getStorage = (): { products: Product[], nextId: number } => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    const initialId = Math.max(...initialProducts.map(p => p.id), 0) + 1;
    const initialData = { products: initialProducts, nextId: initialId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  } catch (error) {
    console.error("Failed to read from localStorage", error);
    const initialId = Math.max(...initialProducts.map(p => p.id), 0) + 1;
    return { products: initialProducts, nextId: initialId };
  }
};

const setStorage = (data: { products: Product[], nextId: number }): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to write to localStorage", error);
  }
};

export const getProducts = async (): Promise<Product[]> => {
  await simulateNetworkDelay();
  const { products } = getStorage();
  return products;
};

export const addProduct = async (newProductData: NewProductPayload): Promise<Product> => {
  await simulateNetworkDelay();
  const storage = getStorage();
  const newProduct: Product = {
    ...newProductData,
    id: storage.nextId,
    imageUrl: '',
  };
  const updatedProducts = [...storage.products, newProduct];
  setStorage({ products: updatedProducts, nextId: storage.nextId + 1 });
  return newProduct;
};

export const addProducts = async (newProductsData: NewProductPayload[]): Promise<{ addedProducts: Product[], duplicateCodes: string[] }> => {
    await simulateNetworkDelay();
    const storage = getStorage();
    const existingCodes = new Set(storage.products.map(p => p.code ? p.code.toLowerCase() : '').filter(Boolean));
    const productsToAdd: Product[] = [];
    const duplicateCodes: string[] = [];
    let nextId = storage.nextId;

    newProductsData.forEach(np => {
        const lowercasedCode = np.code.toLowerCase();
        if (lowercasedCode && existingCodes.has(lowercasedCode)) {
            duplicateCodes.push(np.code);
        } else {
            productsToAdd.push({
                ...np,
                id: nextId++,
                imageUrl: '',
            });
            if (lowercasedCode) {
                existingCodes.add(lowercasedCode);
            }
        }
    });

    if (productsToAdd.length > 0) {
        const updatedProducts = [...storage.products, ...productsToAdd];
        setStorage({ products: updatedProducts, nextId });
    }
    
    return { addedProducts: productsToAdd, duplicateCodes };
};

export const updateProduct = async (productId: number, updatedData: UpdatableProductData): Promise<Product | null> => {
    await simulateNetworkDelay();
    const storage = getStorage();
    let productToUpdate: Product | undefined;
    const updatedProducts = storage.products.map(p => {
        if (p.id === productId) {
            productToUpdate = { ...p, ...updatedData };
            return productToUpdate;
        }
        return p;
    });
    if (productToUpdate) {
        setStorage({ ...storage, products: updatedProducts });
        return productToUpdate;
    }
    return null;
};

export const deleteProduct = async (productId: number): Promise<boolean> => {
    await simulateNetworkDelay();
    const storage = getStorage();
    const updatedProducts = storage.products.filter(p => p.id !== productId);
    if (updatedProducts.length < storage.products.length) {
        setStorage({ ...storage, products: updatedProducts });
        return true;
    }
    return false;
};

export const deleteProducts = async (productIds: number[]): Promise<boolean> => {
    await simulateNetworkDelay();
    const storage = getStorage();
    const idsToDelete = new Set(productIds);
    const updatedProducts = storage.products.filter(p => !idsToDelete.has(p.id));
    if (updatedProducts.length < storage.products.length) {
        setStorage({ ...storage, products: updatedProducts });
        return true;
    }
    return false;
};


export const deleteAllProducts = async (): Promise<boolean> => {
    await simulateNetworkDelay();
    const storage = getStorage();
    setStorage({ ...storage, products: [] });
    return true;
};
