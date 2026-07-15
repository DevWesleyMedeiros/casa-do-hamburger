import {
  type CreateProductInput,
  type ProductResponseDTO,
} from "../../../../types/CreateNewProducts";
import { api } from "../ApiConfig";

export const createProduct = async (
  input: CreateProductInput,
): Promise<ProductResponseDTO> => {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("description", input.description);
  formData.append("category", input.category);
  formData.append("price", input.price);
  formData.append("image", input.image);

  // — o Axios detecta FormData como content-type automaticamente e gera "multipart/form-data; boundary=..." sozinho
  const { data } = await api().post<ProductResponseDTO>(
    "/auth/products",
    formData,
  );
  return data;
};
