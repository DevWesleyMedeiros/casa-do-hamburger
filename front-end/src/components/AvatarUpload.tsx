import { useEffect, useRef, useState, type ChangeEvent } from 'react';

interface AvatarUploadProps {
  name?: string;
  profileAvatarUrl?: string | null; // vem do Google SDK, se existir
  onAvatarSelect?: (file: File) => void; // callback pra quando você criar a persistência
}
export const AvatarUpload = ({ name, profileAvatarUrl, onAvatarSelect }: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profileAvatarUrl ?? null);

  useEffect(() => {
    if (profileAvatarUrl) {
      setPreviewUrl(profileAvatarUrl);
    }
  }, [profileAvatarUrl]);

  // Libera a memória do object URL quando ele deixa de ser usado
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validação básica no client — NUNCA confie só nisso, valide no backend também
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSizeInBytes = 3 * 1024 * 1024; // 3MB

    if (!allowedTypes.includes(file.type)) {
      alert('Formato inválido. Use PNG, JPEG ou WEBP.');
      return;
    }
    if (file.size > maxSizeInBytes) {
      alert('Imagem muito grande. Máximo de 3MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onAvatarSelect?.(file); // aqui você vai plugar o upload real depois
  }

  return (
    <>
      <div
        onClick={handleAvatarClick}
        role="button"
        tabIndex={0}
        aria-label="Alterar foto de perfil"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAvatarClick()}
        className="avatar bg-brand-amber my-1 flex h-18 w-18 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white text-2xl font-bold text-[#161410] transition-opacity hover:opacity-80"
      >
        {previewUrl ? (
          <img src={previewUrl} alt={`Avatar de ${name}`} className="h-full w-full object-cover" />
        ) : (
          name?.charAt?.(0).toUpperCase()
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};
