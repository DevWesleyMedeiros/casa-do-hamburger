import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { api } from "../ApiConfig";
import { ApiError } from "../ApiExceptions";
import { GoogleLoginDate } from "../login/googleLogin";

// Mock do client Axios compartilhado — mesmo padrão a seguir para
// qualquer outro service (Login.ts, RecoveryPass.ts) que ainda não tenha
// teste unitário próprio.
vi.mock("../ApiConfig", () => ({
  api: { post: vi.fn() },
}));

describe("GoogleLoginDate.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna os dados do usuário quando o backend confirma o login", async () => {
    const fakeUser = {
      id: "1",
      name: "Ada",
      email: "ada@example.com",
      admin: false,
    };
    (api.post as Mock).mockResolvedValue({ data: { user: fakeUser } });

    const result = await GoogleLoginDate.create({ idToken: "token-valido" });

    expect(api.post).toHaveBeenCalledWith("/auth/google", {
      idToken: "token-valido",
    });
    expect(result).toEqual({ user: fakeUser });
  });

  it("retorna ApiError 409 quando o backend recusa o vínculo automático (RN-AUTH-11)", async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: "Já existe uma conta com este e-mail." },
      },
    };
    (api.post as Mock).mockRejectedValue(axiosError);

    const result = await GoogleLoginDate.create({ idToken: "token-valido" });

    expect(result).toBeInstanceOf(ApiError);
    expect((result as ApiError).statusCode).toBe(409);
  });

  it("retorna ApiError 500 genérico em erro de rede", async () => {
    (api.post as Mock).mockRejectedValue(new Error("network down"));

    const result = await GoogleLoginDate.create({ idToken: "token-valido" });

    expect(result).toBeInstanceOf(ApiError);
    expect((result as ApiError).statusCode).toBe(500);
  });
});
