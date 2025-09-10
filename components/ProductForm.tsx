import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { PlusIcon, UploadIcon, SearchIcon, TrashIcon, PhotoIcon, PencilIcon, CheckIcon, XMarkIcon, ExclamationTriangleIcon } from './icons';
import { NewProductPayload, UpdatableProductData } from '../api';

// CDNスクリプトからグローバルスコープで利用可能になるXLSXを宣言
declare var XLSX: any;

type EditingProductData = { code: string; name: string; name2: string; sizeCode: string; };

interface ProductFormProps {
  onAddProduct: (product: NewProductPayload) => Promise<boolean>;
  onAddProducts: (products: NewProductPayload[]) => Promise<{ successCount: number; duplicateCodes: string[] }>;
  products: Product[];
  onDeleteProduct: (productId: number) => Promise<void>;
  onDeleteSelectedProducts: (productIds: number[]) => Promise<void>;
  onUpdateProduct: (productId: number, updatedData: UpdatableProductData) => Promise<boolean>;
  onUpdateProductImage: (productId: number, imageUrl: string) => Promise<void>;
  onDeleteAllProducts: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onAddProduct, onAddProducts, products, onDeleteProduct, onDeleteSelectedProducts, onUpdateProduct, onUpdateProductImage, onDeleteAllProducts }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [name2, setName2] = useState('');
  const [sizeCode, setSizeCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const [productToEditImage, setProductToEditImage] = useState<number | null>(null);

  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingProductData, setEditingProductData] = useState<EditingProductData | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [isBulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeTrimmed = code.trim();
    const nameTrimmed = name.trim();
    const name2Trimmed = name2.trim();

    if (codeTrimmed && !nameTrimmed) {
      setError('商品コードを入力した場合は、商品名も必須です。');
      setSuccessMessage('');
      return;
    }
    if (!codeTrimmed && (!nameTrimmed || !name2Trimmed)) {
      setError('商品コードがない場合は、商品名と商品名2の両方が必須です。');
      setSuccessMessage('');
      return;
    }
    
    setIsSubmitting(true);
    const added = await onAddProduct({ code, name, name2, sizeCode });
    setIsSubmitting(false);
    
    if(added) {
        setError('');
        setCode('');
        setName('');
        setName2('');
        setSizeCode('');
        setSuccessMessage(`商品「${nameTrimmed || codeTrimmed}」が正常に登録されました。`);
        setTimeout(() => setSuccessMessage(''), 3000);
    } else {
        setError(`商品コード「${code}」は既に存在します。`);
        setSuccessMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setError('');
    setSuccessMessage('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: (string|number)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const newProducts: NewProductPayload[] = json
          .slice(1)
          .map(row => ({
            code: String(row[0] || '').trim(),
            name: String(row[1] || '').trim(),
            name2: String(row[2] || '').trim(),
            sizeCode: String(row[3] || '').trim(),
          }))
          .filter(p => (p.code && p.name) || (!p.code && p.name && p.name2));

        if (newProducts.length === 0) {
          setError('有効な商品データがExcelファイルに見つかりませんでした。条件に合うデータ（商品コードと商品名、または商品名と商品名2）があるか確認してください。');
          setIsProcessingFile(false);
          return;
        }
        
        const result = await onAddProducts(newProducts);
        
        let successMsg = `${result.successCount}件の商品が正常に登録されました。`;
        if (result.duplicateCodes.length > 0) {
          let errorMsg = `重複のため ${result.duplicateCodes.length}件のデータがスキップされました。`;
          if (result.duplicateCodes.length <= 5) {
             errorMsg += ` (コード: ${result.duplicateCodes.join(', ')})`;
          }
          setError(errorMsg);
        }
        setSuccessMessage(successMsg);

      } catch (err) {
        console.error("File processing error:", err);
        setError("ファイルの処理中にエラーが発生しました。ファイル形式が正しいか確認してください。");
      } finally {
        setIsProcessingFile(false);
        if(fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
        setError("ファイルの読み込みに失敗しました。");
        setIsProcessingFile(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  }

  const handleImageUploadClick = (productId: number) => {
    setProductToEditImage(productId);
    imageUploadInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || productToEditImage === null) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const imageUrl = event.target?.result as string;
        await onUpdateProductImage(productToEditImage, imageUrl);
        setProductToEditImage(null);
    };
    reader.readAsDataURL(file);

    if (imageUploadInputRef.current) {
        imageUploadInputRef.current.value = '';
    }
  };
  
  const handleEditClick = (product: Product) => {
    setEditingProductId(product.id);
    setEditingProductData({
      code: product.code,
      name: product.name,
      name2: product.name2 || '',
      sizeCode: product.sizeCode || '',
    });
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditingProductData(null);
  };

  const handleSaveEdit = async (productId: number) => {
    if (!editingProductData) return;

    const { code, name, name2 } = editingProductData;
    const codeTrimmed = code.trim();
    const nameTrimmed = name.trim();
    const name2Trimmed = name2.trim();

    if (codeTrimmed && !nameTrimmed) {
        setError('商品コードがある場合、商品名は必須です。');
        return;
    }
    if (!codeTrimmed && (!nameTrimmed || !name2Trimmed)) {
        setError('商品コードがない場合、商品名と商品名2は必須です。');
        return;
    }

    const success = await onUpdateProduct(productId, editingProductData);
    if (success) {
      handleCancelEdit();
    } else {
      setError(`商品コード「${editingProductData.code}」は既に存在します。`);
    }
  };

  const handleEditingDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingProductData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const filteredProducts = useMemo(() => {
    const trimmedSearchTerm = adminSearchTerm.trim().toLowerCase();
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
  }, [products, adminSearchTerm]);

  useEffect(() => {
    const existingProductIds = new Set(products.map(p => p.id));
    setSelectedProductIds(prevSelected => {
        const newSelected = new Set(prevSelected);
        let changed = false;
        for (const id of newSelected) {
            if (!existingProductIds.has(id)) {
                newSelected.delete(id);
                changed = true;
            }
        }
        return changed ? newSelected : prevSelected;
    });
  }, [products]);

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      await onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    }
  };

  const cancelDeleteProduct = () => {
    setProductToDelete(null);
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProductIds(prev => {
        const newSelected = new Set(prev);
        if (newSelected.has(productId)) {
            newSelected.delete(productId);
        } else {
            newSelected.add(productId);
        }
        return newSelected;
    });
  };

  const handleSelectAllClick = () => {
    if (selectedProductIds.size === filteredProducts.length) {
        setSelectedProductIds(new Set());
    } else {
        setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleConfirmBulkDelete = async () => {
    await onDeleteSelectedProducts(Array.from(selectedProductIds));
    setSelectedProductIds(new Set());
    setBulkDeleteConfirmOpen(false);
  };

  return (
    <div className="bg-white p-8 rounded-2xl relative">
      <input
        type="file"
        ref={imageUploadInputRef}
        onChange={handleImageFileChange}
        accept="image/png, image/jpeg, image/gif"
        className="hidden"
        aria-hidden="true"
      />
      <h2 className="text-2xl font-bold text-slate-800 mb-6">商品登録</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="productCode" className="block text-sm font-medium text-slate-600 mb-1">
              商品コード
            </label>
            <input
              type="text"
              id="productCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
              placeholder="例: SKU-001"
            />
          </div>
          <div>
            <label htmlFor="sizeCode" className="block text-sm font-medium text-slate-600 mb-1">
              サイズコード
            </label>
            <input
              type="text"
              id="sizeCode"
              value={sizeCode}
              onChange={(e) => setSizeCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
              placeholder="例: M (任意)"
            />
          </div>
          <div>
            <label htmlFor="productName" className="block text-sm font-medium text-slate-600 mb-1">
              商品名
            </label>
            <input
              type="text"
              id="productName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
              placeholder="例: オーガニックコットンTシャツ"
            />
          </div>
          <div>
            <label htmlFor="productName2" className="block text-sm font-medium text-slate-600 mb-1">
              商品名２
            </label>
            <input
              type="text"
              id="productName2"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
              placeholder="例: 半袖 (コードがない場合は必須)"
            />
          </div>
        </div>
        <div className="pt-2">
            <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed"
            >
            {isSubmitting ? '登録中...' : <><PlusIcon />商品を登録する</>}
            </button>
        </div>
      </form>
      
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-300" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm text-slate-500">または</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Excelから一括登録</h3>
        <p className="text-sm text-slate-500 mb-4">
          A列:商品コード, B列:商品名, C列:商品名2, D列:サイズコード の順でヘッダーをつけたファイルをアップロードしてください。
        </p>
         <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          className="hidden"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={isProcessingFile}
          className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold py-3 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UploadIcon />
          {isProcessingFile ? '処理中...' : 'Excelファイルを選択'}
        </button>
      </div>

      {(error || successMessage) && (
        <div className="mt-6 space-y-3">
            {error && <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">{error}</div>}
            {successMessage && <div className="p-3 bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm">{successMessage}</div>}
        </div>
      )}
      
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">登録済み商品一覧</h3>
          {products.length > 0 && selectedProductIds.size === 0 && (
              <button
                onClick={onDeleteAllProducts}
                className="flex items-center gap-1.5 bg-red-600 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200 text-sm"
                aria-label="すべての商品を削除"
              >
                <TrashIcon className="w-4 h-4" />
                一括削除
              </button>
          )}
        </div>
        <div className="relative mb-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                type="text"
                value={adminSearchTerm}
                onChange={e => setAdminSearchTerm(e.target.value)}
                placeholder="登録済み商品を検索..."
                className="w-full block pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
            />
        </div>

        {selectedProductIds.size > 0 && (
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-4 flex justify-between items-center">
                <p className="text-sm font-semibold text-sky-800">{selectedProductIds.size}件選択中</p>
                <button
                    onClick={() => setBulkDeleteConfirmOpen(true)}
                    className="flex items-center gap-1.5 bg-red-600 text-white font-semibold py-1.5 px-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200 text-sm"
                >
                    <TrashIcon className="w-4 h-4" />
                    選択した商品を削除
                </button>
            </div>
        )}

        <div className="max-h-[450px] overflow-y-auto border border-slate-200 rounded-lg">
          {filteredProducts.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100 sticky top-0 z-10">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">
                            <input
                                type="checkbox"
                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                checked={filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length}
                                onChange={handleSelectAllClick}
                                aria-label="すべての商品を選択"
                            />
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">画像</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">商品コード</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">商品名</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">サイズコード</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {filteredProducts.map(product => {
                      const isEditing = editingProductId === product.id;
                      const isSelected = selectedProductIds.has(product.id);
                      return (
                        <tr key={product.id} className={`${isEditing ? "bg-sky-50" : "hover:bg-slate-50"} ${isSelected ? 'bg-sky-100' : ''}`}>
                            <td className="px-4 py-3">
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    checked={isSelected}
                                    onChange={() => handleProductSelect(product.id)}
                                    aria-label={`「${product.name}」を選択`}
                                />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-11 h-11 rounded-md object-cover" />
                              ) : (
                                <div className="w-11 h-11 bg-slate-200 rounded-md flex items-center justify-center">
                                  <PhotoIcon className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                            </td>
                            {isEditing ? (
                                <>
                                  <td className="px-4 py-3">
                                    <input type="text" name="code" value={editingProductData?.code ?? ''} onChange={handleEditingDataChange} className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
                                  </td>
                                  <td className="px-4 py-3">
                                      <input type="text" name="name" value={editingProductData?.name ?? ''} onChange={handleEditingDataChange} className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
                                      <input type="text" name="name2" value={editingProductData?.name2 ?? ''} onChange={handleEditingDataChange} className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 mt-1" />
                                  </td>
                                  <td className="px-4 py-3">
                                      <input type="text" name="sizeCode" value={editingProductData?.sizeCode ?? ''} onChange={handleEditingDataChange} className="w-full text-sm px-2 py-1 border border-slate-300 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500" />
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => handleSaveEdit(product.id)} className="text-green-600 hover:text-green-800 p-1.5 rounded-full hover:bg-green-100 transition-colors duration-150" aria-label="保存">
                                          <CheckIcon />
                                      </button>
                                      <button onClick={handleCancelEdit} className="text-slate-600 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-200 transition-colors duration-150" aria-label="キャンセル">
                                          <XMarkIcon />
                                      </button>
                                    </div>
                                  </td>
                                </>
                            ) : (
                                <>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-medium">{product.code}</td>
                                  <td className="px-4 py-3 text-sm text-slate-800">
                                    <div className="font-semibold">{product.name}</div>
                                    {product.name2 && <div className="text-slate-500">{product.name2}</div>}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{product.sizeCode}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => handleEditClick(product)} className="text-slate-600 hover:text-slate-900 p-1.5 rounded-full hover:bg-slate-200 transition-colors duration-150" aria-label={`「${product.name}」を編集`}>
                                          <PencilIcon className="w-5 h-5" />
                                      </button>
                                      <button onClick={() => handleImageUploadClick(product.id)} className="text-sky-600 hover:text-sky-800 transition-colors duration-150 p-1.5 rounded-full hover:bg-sky-100" aria-label={`「${product.name}」の画像をアップロード`}>
                                          <UploadIcon className="w-5 h-5" />
                                      </button>
                                      <button onClick={() => setProductToDelete(product)} className="text-red-600 hover:text-red-800 transition-colors duration-150 p-1.5 rounded-full hover:bg-red-100" aria-label={`「${product.name}」を削除`}>
                                          <TrashIcon className="w-5 h-5" />
                                      </button>
                                    </div>
                                  </td>
                                </>
                            )}
                        </tr>
                      )
                    })}
                </tbody>
            </table>
          ) : (
             <div className="text-center py-16 px-6">
                <p className="text-slate-500">該当する商品はありません。</p>
            </div>
          )}
        </div>
      </div>

      {productToDelete && (
        <div 
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex justify-center items-center z-20 p-4"
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="delete-confirm-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-8 transform transition-all text-center">
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

      {isBulkDeleteConfirmOpen && (
        <div 
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex justify-center items-center z-20 p-4"
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="bulk-delete-confirm-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-8 transform transition-all text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <h3 id="bulk-delete-confirm-title" className="text-xl font-bold text-slate-800 mt-5">選択した商品を削除</h3>
            <p className="text-slate-600 mt-2">
              選択された <span className="font-semibold">{selectedProductIds.size}件</span> の商品を完全に削除します。
              <br />
              この操作は元に戻せません。よろしいですか？
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button 
                type="button" 
                onClick={() => setBulkDeleteConfirmOpen(false)}
                className="bg-white text-slate-700 font-semibold py-2.5 px-6 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200"
              >
                キャンセル
              </button>
              <button 
                type="button" 
                onClick={handleConfirmBulkDelete} 
                className="bg-red-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductForm;