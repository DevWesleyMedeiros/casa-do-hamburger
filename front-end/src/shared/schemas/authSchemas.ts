// vamos definir os schemas padrõa para as validações e uso dos nossos inputs

import { z } from "zod";

// validações para registro Register.tsx
export const registerSchema = z
  .object({
    // regras para cada nome de input registrado
    name: z
      .string()
      .min(1, "Nome é obrigatório") // não pode ser vazio, pois no mínimo um caractér
      .min(2, "mínimo dois caractéres") // nome não pode ser um único carater ou vazio
      .trim(), // remove os espaços das bordas

    email: z
      .string()
      .min(1, "E-mail é obrigatório")
      .email("Formato de e-mail inválido") // valida presença do @ e domínio
      .trim(),

    password: z
      .string()
      .min(1, "Senha obrigatória")
      .min(9, "mínimo 9 caractéres")
      .regex(/[A-Z]/, "deve conter uma letre maiúscula")
      .regex(/[a-z]/, "deve conter uma letra minúscula")
      .regex(/[0-9]/, "deve conter um valor numérico")
      .regex(/[^a-zA-Z0-9]/, "deve conter um caractér especial")
      .trim(),

    confirmPassword: z
      .string()
      .min(1, "Confirmação de senha é obrigatória")
      .trim(),

    cep: z
      .string() // no banco de dados é string
      .min(1, "cep é obrigatório")
      .regex(/^\d{5}-?\d{3}$/, "CEP inválido. Formato válido: 00000-000")
      .trim(),

    // .refine() serve para validações que cruzam dois campos
    // o Zod não consegue comparar password com confirmPassword dentro do .object()
    // porque cada campo é validado de forma isolada
  })
  // o método refine com (date) itera sobre cada campo do schema e captura suas propriedades
  .refine((date) => date.password === date.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"], // aponta o erro no campo confirmPassword
  });

// tipo inferido automaticamente do schema
// RegisterInput = { name: string, email: string, password: string, confirmPassword: string, cep: string }
// exporto eles como types, uma vez que serão tipos seguidos pelo meus inputs
// com Zod — TypeScript lê o schema e infere o tipo automaticamente
export type registerInput = z.infer<typeof registerSchema>;

// meu registerInput é literalmente um interface RegisterInput =
// { name: string
//   email: string
//   password: string
//   confirmPassword: string
//   cep: string
// }
