
export interface Product {
  id: number;
  code: string;
  name: string;
  name2?: string;
  sizeCode?: string;
  imageUrl?: string;
}

export interface SelectedProduct extends Product {
  quantity: number;
}
