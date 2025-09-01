
import React, { useState, useMemo } from 'react';
import { SelectedProduct } from '../types';
import { TrashIcon, DownloadIcon, BoxIcon, SortAscendingIcon, XMarkIcon } from './icons';

// CDNスクリプトからグローバルスコープで利用可能になるXLSXを宣言
declare var XLSX: any;

interface SelectedProductListProps {
  products: SelectedProduct[];
  onRemoveProduct: (productId: number) => void;
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
}

const SelectedProductList: React.FC<SelectedProductListProps> = ({ products, onRemoveProduct, onUpdateQuantity }) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'none'>('none');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    company: '',
    contact: '',
    phone: '',
    email: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
  });
  const [modalError, setModalError] = useState('');

  const displayedProducts = useMemo(() => {
    if (sortOrder === 'none') {
      return products;
    }
    
    return [...products].sort((a, b) => {
        const sizeA = a.sizeCode || '';
        const sizeB = b.sizeCode || '';

        // 空のsizeCodeを末尾に配置
        if (sizeA === '' && sizeB !== '') return 1;
        if (sizeA !== '' && sizeB === '') return -1;
        if (sizeA === '' && sizeB === '') return 0;

        return sizeA.localeCompare(sizeB, undefined, { numeric: true });
    });
  }, [products, sortOrder]);

  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateExcel = () => {
    if (!customerInfo.company.trim() || !customerInfo.contact.trim()) {
      setModalError('社名と担当者名は必須です。');
      return;
    }
    setModalError('');
    if (displayedProducts.length === 0) {
      return;
    }
    
    const headerData = [
      ['Letra卸事業部 注文シート'],
      [],
      ['ご注文情報'],
      ['社名', customerInfo.company],
      ['担当者名', customerInfo.contact],
      ['連絡先', customerInfo.phone],
      ['メールアドレス', customerInfo.email],
      ['発注日', customerInfo.orderDate],
      ['納品希望日', customerInfo.deliveryDate],
      [],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(headerData);
    
    worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title: Letra卸事業部 注文シート
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Subtitle: ご注文情報
    ];

    const dataToExport = displayedProducts.map(p => ({
      '商品コード': p.code,
      '商品名': p.name,
      '商品名２': p.name2 || '',
      'サイズコード': p.sizeCode || '',
      '数量': p.quantity,
    }));

    XLSX.utils.sheet_add_json(worksheet, dataToExport, { origin: 'A11', skipHeader: false });
    
    worksheet['!cols'] = [
        { wch: 25 }, // 社名 field / 商品コード
        { wch: 30 }, // Value field / 商品名
        { wch: 20 }, // 商品名２
        { wch: 15 }, // サイズコード
        { wch: 10 }, // 数量
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '注文シート');
    XLSX.writeFile(workbook, `注文シート_${customerInfo.company || '御中'}.xlsx`);

    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">選択中の商品リスト</h2>
        {products.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
              aria-label="Excel形式でダウンロード"
            >
              <DownloadIcon className="w-5 h-5" />
              Excelダウンロード
            </button>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 px-6 border-2 border-dashed border-slate-200 rounded-lg h-full flex flex-col justify-center items-center">
            <BoxIcon className="mx-auto h-16 w-16 text-slate-400" />
            <h3 className="mt-5 text-lg font-medium text-slate-900">商品が選択されていません</h3>
            <p className="mt-1 text-sm text-slate-500">左の検索パネルから商品を追加してください。</p>
        </div>
      ) : (
        <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-700 sm:pl-6">
                          画像
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-700">
                        商品コード
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-700">
                        商品名
                        </th>
                        <th 
                          scope="col" 
                          className="px-3 py-3.5 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors"
                          onClick={() => setSortOrder('asc')}
                          aria-label="サイズコードで昇順に並び替え"
                        >
                          <div className="flex items-center gap-1">
                            サイズコード
                            {sortOrder === 'asc' && <SortAscendingIcon className="text-slate-600" />}
                          </div>
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-700">
                        数量
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">削除</span>
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                    {displayedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50 even:bg-slate-50/50 transition-colors duration-150">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-md object-cover" />
                            ) : (
                              <div className="w-14 h-14 bg-slate-100 rounded-md flex items-center justify-center">
                                <BoxIcon className="w-7 h-7 text-slate-400" />
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm font-medium text-slate-700">
                              {product.code}
                          </td>
                          <td className="px-3 py-5 text-sm text-slate-800">
                            <div className="font-semibold">{product.name}</div>
                            {product.name2 && <div className="text-slate-500">{product.name2}</div>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-500">{product.sizeCode}</td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm text-slate-500">
                           <input
                            type="number"
                            min="1"
                            value={product.quantity}
                            onChange={(e) => {
                                const newQuantity = parseInt(e.target.value, 10);
                                if (!isNaN(newQuantity) && newQuantity >= 1) {
                                onUpdateQuantity(product.id, newQuantity);
                                }
                            }}
                            className="w-20 rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                            aria-label={`数量 ${product.name}`}
                            />
                        </td>
                        <td className="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                                onClick={() => onRemoveProduct(product.id)}
                                className="text-red-600 hover:text-red-800 transition-colors duration-150 p-1.5 rounded-full hover:bg-red-100"
                                aria-label={`「${product.name}」を削除`}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
            </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-800/60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 transform transition-all">
            <div className="flex justify-between items-start mb-6">
              <h3 id="modal-title" className="text-2xl font-bold text-slate-800">注文情報入力</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                <span className="sr-only">閉じる</span>
                <XMarkIcon className="w-6 h-6" /> 
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="company" className="block text-sm font-medium text-slate-600 mb-1">社名 <span className="text-red-500">*</span></label>
                    <input type="text" name="company" id="company" value={customerInfo.company} onChange={handleCustomerInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <div>
                    <label htmlFor="contact" className="block text-sm font-medium text-slate-600 mb-1">担当者名 <span className="text-red-500">*</span></label>
                    <input type="text" name="contact" id="contact" value={customerInfo.contact} onChange={handleCustomerInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-600 mb-1">連絡先</label>
                    <input type="tel" name="phone" id="phone" value={customerInfo.phone} onChange={handleCustomerInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-600 mb-1">メールアドレス</label>
                    <input type="email" name="email" id="email" value={customerInfo.email} onChange={handleCustomerInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="orderDate" className="block text-sm font-medium text-slate-600 mb-1">発注日</label>
                    <input type="date" name="orderDate" id="orderDate" value={customerInfo.orderDate} onChange={handleCustomerInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <div>
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-slate-600 mb-1">納品希望日</label>
                    <input type="date" name="deliveryDate" id="deliveryDate" value={customerInfo.deliveryDate} onChange={handleCustomerInfoChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500" />
                </div>
              </div>
            </div>
            
            {modalError && <p className="text-sm text-red-600 mt-4 text-center">{modalError}</p>}
            
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="bg-white text-slate-700 font-semibold py-2.5 px-5 rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200">
                キャンセル
              </button>
              <button type="button" onClick={handleGenerateExcel} className="flex items-center gap-2 bg-teal-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5">
                <DownloadIcon className="w-5 h-5" />
                ダウンロード
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SelectedProductList;