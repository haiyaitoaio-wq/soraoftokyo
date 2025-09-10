import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, SelectedProduct } from './types';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import SelectedProductList from './components/SelectedProductList';
import { SearchIcon, BoxIcon, CogIcon, XMarkIcon, ExclamationTriangleIcon, LockClosedIcon } from './components/icons';
import * as api from './api';
import { NewProductPayload, UpdatableProductData } from './api';

type NewProduct = { code: string; name: string; name2: string; sizeCode: string; };

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isRegistrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isDeleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
  const [isPasswordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fetchProducts = useCallback(async () => {
    // Keep loading true if it's already true, otherwise set it for re-fetches
    setIsLoading(prev => prev || true);
    try {
        const fetchedProducts = await api.getProducts();
        setProducts(fetchedProducts);
    } catch (error) {
        console.error("Failed to fetch products:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    // Sync selected products when the main product list changes (e.g., after an edit/delete)
    setSelectedProducts(prevSelected => {
      const productMap = new Map(products.map(p => [p.id, p]));
      return prevSelected
        .map(sp => {
          const updatedProduct = productMap.get(sp.id);
          // If product still exists, update its details from the master list
          return updatedProduct ? { ...updatedProduct, quantity: sp.quantity } : null;
        })
        .filter((p): p is SelectedProduct => p !== null); // Filter out products that were deleted
    });
  }, [products]);


  const handleAddProduct = async (newProduct: NewProductPayload): Promise<boolean> => {
    const codeTrimmed = newProduct.code.trim();
    if (codeTrimmed && products.some(p => p.code.toLowerCase() === codeTrimmed.toLowerCase())) {
        return false;
    }
    await api.addProduct(newProduct);
    await fetchProducts();
    return true;
  };

  const handleBulkAddProducts = async (newProducts: NewProductPayload[]) => {
    const result = await api.addProducts(newProducts);
    await fetchProducts();
    return {
        successCount: result.addedProducts.length,
        duplicateCodes: result.duplicateCodes,
    };
  };

  const handleDeleteProduct = async (productId: number) => {
    await api.deleteProduct(productId);
    await fetchProducts();
  };
  
  const handleDeleteSelectedProducts = async (productIds: number[]) => {
    await api.deleteProducts(productIds);
    await fetchProducts();
  };

  const handleDeleteAllProductsClick = () => {
    setDeleteAllConfirmOpen(true);
  };

  const confirmDeleteAllProducts = async () => {
    await api.deleteAllProducts();
    await fetchProducts();
    setDeleteAllConfirmOpen(false);
  };

  const cancelDeleteAllProducts = () => {
    setDeleteAllConfirmOpen(false);
  };

  const handleUpdateProduct = async (productId: number, updatedData: UpdatableProductData): Promise<boolean> => {
    const codeTrimmed = updatedData.code?.trim();
    if (codeTrimmed) {
        const isDuplicate = products.some(p => 
            p.id !== productId && p.code.toLowerCase() === codeTrimmed.toLowerCase()
        );
        if (isDuplicate) {
            return false;
        }
    }
    await api.updateProduct(productId, updatedData);
    await fetchProducts();
    return true;
  };

  const handleUpdateProductImage = async (productId: number, imageUrl: string) => {
    await api.updateProduct(productId, { imageUrl });
    await fetchProducts();
  };

  const handleSelectProduct = (product: Product, quantity: number) => {
    setSelectedProducts(prevSelected => {
      const existingProductIndex = prevSelected.findIndex(p => p.id === product.id);
      if (existingProductIndex > -1) {
        const updatedSelected = [...prevSelected];
        const existingProduct = updatedSelected[existingProductIndex];
        updatedSelected[existingProductIndex] = {
          ...existingProduct,
          quantity: existingProduct.quantity + quantity,
        };
        return updatedSelected;
      } else {
        return [...prevSelected, { ...product, quantity }];
      }
    });
  };

  const handleRemoveSelectedProduct = (productId: number) => {
    setSelectedProducts(prevSelected => prevSelected.filter(p => p.id !== productId));
  };
  
  const handleUpdateSelectedProductQuantity = (productId: number, newQuantity: number) => {
    setSelectedProducts(prevSelected => 
      prevSelected.map(p => 
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handleImageView = (imageUrl: string) => {
    setViewingImage(imageUrl);
  };

  const handleCloseImageView = () => {
    setViewingImage(null);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '9910') {
      setPasswordError('');
      setPasswordInput('');
      setPasswordPromptOpen(false);
      setRegistrationModalOpen(true);
    } else {
      setPasswordError('パスワードが正しくありません。');
      setPasswordInput('');
    }
  };

  const filteredProducts = useMemo(() => {
    const trimmedSearchTerm = searchTerm.trim().toLowerCase();
    if (!trimmedSearchTerm) {
      return products;
    }

    const keywords = trimmedSearchTerm.split(/\s+/).filter(Boolean);

    return products.filter(product => {
      return keywords.every(keyword => 
        product.code.toLowerCase().includes(keyword) ||
        product.name.toLowerCase().includes(keyword) ||
        (product.name2 && product.name2.toLowerCase().includes(keyword)) ||
        (product.sizeCode && product.sizeCode.toLowerCase().includes(keyword))
      );
    });
  }, [products, searchTerm]);
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <BoxIcon className="w-8 h-8 text-sky-600" />
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Letra卸事業部注文シート</h1>
            </div>
            <div>
                <button
                    onClick={() => setPasswordPromptOpen(true)}
                    className="flex items-center gap-2 bg-white text-slate-600 font-semibold py-2 px-4 rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 ease-in-out"
                    aria-label="商品登録フォームを開く"
                >
                    <CogIcon />
                    <span>管理者用</span>
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Column 1: Product Search & Results */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/75 h-full">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">商品検索</h2>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                   <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="商品コード、商品名、サイズ等で検索..."
                  className="w-full block pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out text-base"
                />
              </div>
              <ProductList 
                products={filteredProducts} 
                onProductSelect={handleSelectProduct}
                onImageClick={handleImageView}
                isLoading={isLoading}
              />
            </div>
          </div>
          
          {/* Column 2: Selected Products List */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/75 h-full">
              <SelectedProductList 
                products={selectedProducts} 
                onRemoveProduct={handleRemoveSelectedProduct}
                onUpdateQuantity={handleUpdateSelectedProductQuantity}
              />
            </div>
          </div>

        </div>
      </main>
      
      {isRegistrationModalOpen && (
        <div className="fixed inset-0 bg-slate-800/60 flex justify-center items-start z-50 p-4 pt-12 sm:pt-20 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="registration-modal-title">
           <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
            .modal-content { animation: slideIn 0.3s ease-out forwards; }
            .modal-backdrop { animation: fadeIn 0.3s ease-out forwards; }
          `}</style>
          <div className="bg-slate-100 rounded-2xl shadow-xl w-full max-w-4xl modal-content relative">
             <div className="p-2 absolute top-2 right-2 z-10">
                <button 
                    onClick={() => setRegistrationModalOpen(false)} 
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    aria-label="商品登録フォームを閉じる"
                >
                    <span className="sr-only">閉じる</span>
                    <XMarkIcon className="w-6 h-6" />
                </button>
             </div>
             <div id="registration-modal-title" className="sr-only">商品登録フォーム</div>
             <ProductForm 
                onAddProduct={handleAddProduct} 
                onAddProducts={handleBulkAddProducts} 
                products={products}
                onDeleteProduct={handleDeleteProduct}
                onDeleteSelectedProducts={handleDeleteSelectedProducts}
                onUpdateProduct={handleUpdateProduct}
                onUpdateProductImage={handleUpdateProductImage}
                onDeleteAllProducts={handleDeleteAllProductsClick}
             />
          </div>
        </div>
      )}

      {viewingImage && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4" 
            onClick={handleCloseImageView}
            role="dialog"
            aria-modal="true"
            aria-label="画像拡大表示"
        >
            <style>
              {`
                @keyframes zoomIn {
                  from { opacity: 0; transform: scale(0.9); }
                  to { opacity: 1; transform: scale(1); }
                }
                .animate-zoomIn {
                  animation: zoomIn 0.2s ease-out;
                }
              `}
            </style>
            <div 
                className="relative max-w-4xl w-full max-h-[90vh] p-2 sm:p-4 animate-zoomIn"
                onClick={(e) => e.stopPropagation()}
            >
                <img 
                    src={viewingImage} 
                    alt="拡大画像" 
                    className="object-contain w-full h-full max-h-[calc(90vh-2rem)] rounded-lg shadow-2xl"
                />
                <button 
                    onClick={handleCloseImageView} 
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white text-slate-800 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white transition-colors"
                    aria-label="拡大表示を閉じる"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
      )}

      {isDeleteAllConfirmOpen && (
        <div 
            className="fixed inset-0 bg-slate-900/70 flex justify-center items-center z-60 p-4" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="delete-all-confirm-title"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 transform transition-all text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <h3 id="delete-all-confirm-title" className="text-xl font-bold text-slate-800 mt-5">すべての商品を削除</h3>
            <p className="text-slate-600 mt-2">
              登録されているすべての商品を完全に削除します。
              <br />
              この操作は元に戻せません。よろしいですか？
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button 
                type="button" 
                onClick={cancelDeleteAllProducts} 
                className="bg-white text-slate-700 font-semibold py-2.5 px-6 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200"
              >
                キャンセル
              </button>
              <button 
                type="button" 
                onClick={confirmDeleteAllProducts} 
                className="bg-red-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                すべて削除
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasswordPromptOpen && (
        <div className="fixed inset-0 bg-slate-900/70 flex justify-center items-center z-60 p-4" role="dialog" aria-modal="true" aria-labelledby="password-prompt-title">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 transform transition-all text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
              <LockClosedIcon className="h-8 w-8 text-sky-600" aria-hidden="true" />
            </div>
            <h3 id="password-prompt-title" className="text-xl font-bold text-slate-800 mt-5">管理者パスワード</h3>
            <p className="text-slate-600 mt-2">
              管理者用ページにアクセスするにはパスワードを入力してください。
            </p>
            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-center px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
                placeholder="••••••••"
                autoFocus
              />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              <div className="mt-6 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                      setPasswordPromptOpen(false);
                      setPasswordError('');
                      setPasswordInput('');
                  }}
                  className="bg-white text-slate-700 font-semibold py-2.5 px-6 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200"
                >
                  認証
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
