// types para interface de produtos
export interface ProductsInterface {
  productId: string;
  category: string;
  name: string;
  description: string;
  price: number;
  img: string;
  createAt?: Date;
  setProducts?: React.Dispatch<React.SetStateAction<ProductsInterface[]>>;
  // setProducts permite eu manipular o array de produtos e atualizá-los
}

