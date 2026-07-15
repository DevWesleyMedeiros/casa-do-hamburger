// types para interface de produtos
export interface ProductsInterface {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  createAt?: Date;
  // setProducts?: React.Dispatch<React.SetStateAction<ProductsInterface[]>>;
  // setProducts permite eu manipular o array de produtos e atualizá-los
  // Com TanStack Query, não passa setState entre componentes — o cache é os mutatios serão os responda.
}
