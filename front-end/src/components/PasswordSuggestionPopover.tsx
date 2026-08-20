// src/components/PasswordSuggestionPopover.tsx
import { useState, useCallback } from "react";
import { Copy, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { usePasswordGenerator } from "../hook/usePasswordStrength";
import { ICON_CONFIG } from "../constant/iconConfig";

interface PasswordSuggestionPopoverProps {
  // devolve a senha escolhida para quem estiver usando o componente
  onApplyPassword: (password: string) => void;
}

export const PasswordSuggestionPopover = ({
  onApplyPassword,
}: PasswordSuggestionPopoverProps) => {
  const [showPopover, setShowPopover] = useState(false);
  const [suggestedPassword, setSuggestedPassword] = useState("");
  const { generateSecurePassword } = usePasswordGenerator();

  // abre o popover com uma sugestão de senha
  const handleSuggestPassword = useCallback(() => {
    setSuggestedPassword(generateSecurePassword());
    setShowPopover((prev) => !prev);
  }, [generateSecurePassword]);

  // gera outra senha sem fechar o popover
  const handleRegeneratePassword = useCallback(() => {
    setSuggestedPassword(generateSecurePassword());
    toast("Nova senha gerada");
  }, [generateSecurePassword]);

  // copia a senha sugerida para a área de transferência
  const handleCopyPassword = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(suggestedPassword);
      toast.success("Senha copiada para área de transferência");
    } catch {
      toast.error("Não foi possível copiar a senha");
    }
  }, [suggestedPassword]);

  // aplica a senha sugerida e fecha o popover
  const handleUsePassword = useCallback(() => {
    onApplyPassword(suggestedPassword);
    setShowPopover(false);
    toast.success("Senha aplicada!");
  }, [onApplyPassword, suggestedPassword]);

  return (
    <>
      <button
        type="button"
        onClick={handleSuggestPassword}
        className="absolute top-1/2 right-2 -translate-y-1/2 text-white/40 transition-colors hover:text-[#F2DAAC]"
        aria-label="Sugerir senha forte"
        title="Sugerir senha forte"
      >
        <Wand2 size={ICON_CONFIG.mnSize} />
      </button>

      {showPopover && (
        <div className="mt-2 rounded-lg border border-white/12 bg-[#1f1d18] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-mono text-sm break-all text-white/80">
              {suggestedPassword}
            </p>
            <button
              type="button"
              onClick={handleCopyPassword}
              className="shrink-0 text-white/40 transition-colors hover:text-[#F2DAAC]"
              aria-label="Copiar senha sugerida"
              title="Copiar senha"
            >
              <Copy size={ICON_CONFIG.mnSize} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUsePassword}
              className="flex-1 rounded-md bg-[#C41E00] py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#a81900]"
            >
              Usar esta senha
            </button>
            <button
              type="button"
              onClick={handleRegeneratePassword}
              className="flex-1 rounded-md border border-white/12 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/5"
            >
              Gerar outra
            </button>
            <button
              type="button"
              onClick={() => setShowPopover(false)}
              className="rounded-md border border-white/8 px-2.5 py-1.5 text-white/40 transition-colors hover:bg-white/5"
              aria-label="Fechar sugestão"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
