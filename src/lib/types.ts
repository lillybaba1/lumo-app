
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  paymentMethod: 'Wave Money' | 'Cash on Delivery';
}

export interface Pages {
  [key: string]: PageContent;
}

export interface PageContent {
  title: string;
  content: string;
}

export interface User {
    uid: string;
    email: string;
    name: string;
    createdAt: string;
    role: 'admin' | 'customer';
}
