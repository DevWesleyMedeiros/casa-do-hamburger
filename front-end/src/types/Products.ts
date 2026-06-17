// types para interface de produtos
export interface ProductsInterface {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  img: string;
  createAt?: Date;
}
