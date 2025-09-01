import React, { useState } from 'react';
import { Product } from '../types';
import { BoxIcon } from './icons';

interface ProductListProps {
  products: Product[];
  onProductSelect: (product: Product, quantity: number) => void;
  onImageClick: (imageUrl: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onProductSelect, onImageClick }) => {
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  const handleQuantityChange = (productId: number, value: string) => {
    const quantity = parseInt(value, 10);
    setQuantities(prev => ({
      ...prev,
      [productId]: isNaN(quantity) || quantity < 1 ? 1 : quantity,
    }));
  };

  const handleAddClick = (product: Product) => {
    const quantity = quantities[product.id] || 1;
    onProductSelect(product, quantity);
  };

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
            {products.length > 0 ? (
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
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-700">
                      サイズコード
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-700 w-24">
                      数量
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-left text-sm font-semibold text-slate-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50 even:bg-slate-50/50 transition-colors duration-150"
                      aria-label={product.name}
                    >
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        {product.imageUrl ? (
                           <button 
                              onClick={() => onImageClick(product.imageUrl!)} 
                              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 rounded-md"
                              aria-label={`「${product.name}」の画像を拡大表示`}
                            >
                              <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-md object-cover transition-transform duration-200 hover:scale-105" />
                            </button>
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
                          value={quantities[product.id] || 1}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-20 rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
                          aria-label={`数量 ${product.name}`}
                        />
                      </td>
                      <td className="relative whitespace-nowrap py-5 pl-3 pr-4 text-sm font-medium sm:pr-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddClick(product)}
                            className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
                          >
                            登録
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16 px-6 bg-white rounded-lg">
                <p className="text-slate-500">検索条件に一致する商品はありません。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;