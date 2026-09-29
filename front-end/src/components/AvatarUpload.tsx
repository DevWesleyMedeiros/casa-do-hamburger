import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { useAvatar } from '../hook/useAvatar';

interface AvatarUploadProps {
  name?: string;
  avatarUrl?: string | null;
}

export const AvatarUpload = ({ name, avatarUrl }: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl ?? null);
  const { mutate: updateAvatar, isPending } = useAvatar();

  useEffect(() => {
    queueMicrotask(() => setPreviewUrl(avatarUrl ?? null));
  }, [avatarUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleAvatarClick() {
    if (isPending) return;
    fileInputRef.current?.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSizeInBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, JPEG ou WEBP.');
      event.target.value = '';
      return;
    }

    if (file.size > maxSizeInBytes) {
      toast.error('Imagem muito grande. Máximo de 5MB.');
      event.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);

    // preview imediato
    setPreviewUrl(objectUrl);

    updateAvatar(file, {
      onSuccess: () => {
        toast.success('Foto de perfil atualizada.');
      },

      onError: () => {
        queueMicrotask(() => setPreviewUrl(avatarUrl ?? null));
        toast.error('Não foi possível atualizar a foto de perfil.');
      },

      onSettled: () => {
        event.target.value = '';
      },
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleAvatarClick}
        disabled={isPending}
        aria-label="Alterar foto de perfil"
        className="avatar bg-brand-amber my-1 flex h-18 w-18 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white text-2xl font-bold text-[#161410] transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-60"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`Avatar de ${name ?? 'usuário'}`}
            className="h-full w-full object-cover"
          />
        ) : (
          name?.charAt(0).toUpperCase()
        )}
      </button>

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
