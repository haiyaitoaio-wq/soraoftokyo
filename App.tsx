import React, { useState, useMemo } from 'react';
import { Product, SelectedProduct } from './types';
import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import SelectedProductList from './components/SelectedProductList';
import { SearchIcon, BoxIcon, CogIcon, XMarkIcon, ExclamationTriangleIcon } from './components/icons';

type NewProduct = { code: string; name: string; name2: string; sizeCode: string; };

const initialProducts: Product[] = [
  { id: 1, code: 'SKU-001', name: 'オーガニックコットンTシャツ', name2: '半袖', sizeCode: 'M', imageUrl: '' },
  { id: 2, code: 'SKU-002', name: 'リネンブレンドパンツ', name2: 'アンクル丈', sizeCode: 'L', imageUrl: '' },
  { id: 3, code: 'SKU-003', name: 'シルクカシミヤセーター', name2: '', sizeCode: 'S', imageUrl: '' },
  { id: 4, code: 'ACC-001', name: 'レザーベルト', name2: 'バックル', sizeCode: 'FREE', imageUrl: '' },
  { id: 5, code: 'ACC-002', name: 'ウールマフラー', name2: '', sizeCode: '', imageUrl: '' },
  { id: 6, code: 'BG-010', name: 'BAG ROMBO', name2: 'BLK XS', sizeCode: 'XS', imageUrl: '' },
];

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isRegistrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);

  const handleAddProduct = (newProduct: NewProduct): boolean => {
    const codeTrimmed = newProduct.code.trim();
    // 商品コードが入力されている場合のみ重複チェック
    if (codeTrimmed && products.some(p => p.code.toLowerCase() === codeTrimmed.toLowerCase())) {
        return false;
    }
    setProducts(prevProducts => [
      ...prevProducts,
      {
        id: Date.now(),
        ...newProduct,
        imageUrl: '',
      },
    ]);
    return true;
  };

  const handleBulkAddProducts = (newProducts: NewProduct[]) => {
    const existingCodes = new Set(products.map(p => p.code ? p.code.toLowerCase() : '').filter(Boolean));
    const productsToAdd: Product[] = [];
    const duplicateCodes: string[] = [];
    let latestId = Date.now();

    newProducts.forEach(np => {
      const lowercasedCode = np.code.toLowerCase();
      // 商品コードが存在する場合のみ重複チェック
      if (lowercasedCode && existingCodes.has(lowercasedCode)) {
        duplicateCodes.push(np.code);
      } else {
        productsToAdd.push({
           id: ++latestId,
           ...np,
           imageUrl: '',
        });
        // 重複チェックセットにもコードが存在する場合のみ追加
        if (lowercasedCode) {
          existingCodes.add(lowercasedCode);
        }
      }
    });

    if(productsToAdd.length > 0) {
      setProducts(prev => [...prev, ...productsToAdd]);
    }

    return {
      successCount: productsToAdd.length,
      duplicateCodes: duplicateCodes,
    };
  };

  const handleDeleteProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductToDelete(product);
    }
  };
  
  const handleDeleteAllProductsClick = () => {
    setDeleteAllConfirmOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;

    setProducts(prevProducts => prevProducts.filter(p => p.id !== productToDelete.id));
    setSelectedProducts(prevSelected => prevSelected.filter(p => p.id !== productToDelete.id));
    
    setProductToDelete(null);
  };

  const cancelDeleteProduct = () => {
    setProductToDelete(null);
  };

  const confirmDeleteAllProducts = () => {
    setProducts([]);
    setSelectedProducts([]);
    setDeleteAllConfirmOpen(false);
  };

  const cancelDeleteAllProducts = () => {
    setDeleteAllConfirmOpen(false);
  };

  const handleUpdateProduct = (productId: number, updatedData: { code: string; name: string; name2: string; sizeCode: string; }): boolean => {
    const codeTrimmed = updatedData.code.trim();
    // 商品コードが入力されている場合のみ重複チェック
    if (codeTrimmed) {
        const isDuplicate = products.some(p => 
            p.id !== productId && p.code.toLowerCase() === codeTrimmed.toLowerCase()
        );

        if (isDuplicate) {
            return false;
        }
    }

    setProducts(prevProducts =>
        prevProducts.map(p =>
            p.id === productId ? { ...p, ...updatedData } : p
        )
    );
    setSelectedProducts(prevSelected =>
        prevSelected.map(p =>
            p.id === productId ? { ...p, ...updatedData, quantity: p.quantity } : p
        )
    );
    return true;
  };

  const handleUpdateProductImage = (productId: number, imageUrl: string) => {
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, imageUrl } : p
      )
    );
    setSelectedProducts(prevSelected =>
      prevSelected.map(p =>
        p.id === productId ? { ...p, imageUrl } : p
      )
    );
  };

  const handleSelectProduct = (product: Product, quantity: number) => {
    setSelectedProducts(prevSelected => {
      const existingProductIndex = prevSelected.findIndex(p => p.id === product.id);

      if (existingProductIndex > -1) {
        // Product already in list, so update quantity
        const updatedSelected = [...prevSelected];
        const existingProduct = updatedSelected[existingProductIndex];
        updatedSelected[existingProductIndex] = {
          ...existingProduct,
          quantity: existingProduct.quantity + quantity,
        };
        return updatedSelected;
      } else {
        // Product not in list, add it
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
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">商品管理アプリ</h1>
            </div>
            <div>
                <button
                    onClick={() => setRegistrationModalOpen(true)}
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

      {productToDelete && (
        <div 
            className="fixed inset-0 bg-slate-900/70 flex justify-center items-center z-60 p-4" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="delete-confirm-title"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 transform transition-all text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <h3 id="delete-confirm-title" className="text-xl font-bold text-slate-800 mt-5">商品を削除</h3>
            <p className="text-slate-600 mt-2">
              「<span className="font-semibold">{productToDelete.name}</span>」を完全に削除します。
              <br />
              この操作は元に戻せません。よろしいですか？
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button 
                type="button" 
                onClick={cancelDeleteProduct} 
                className="bg-white text-slate-700 font-semibold py-2.5 px-6 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200"
              >
                キャンセル
              </button>
              <button 
                type="button" 
                onClick={confirmDeleteProduct} 
                className="bg-red-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                削除する
              </button>
            </div>
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
    </div>
  );
};

export default App;