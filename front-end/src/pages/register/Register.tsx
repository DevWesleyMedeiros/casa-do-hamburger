import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/button/Button';
import { Input } from '../../components/input/Input';
import { PasswordSuggestionPopover } from '../../components/PasswordSuggestionPopover';
import { ICON_CONFIG } from '../../constant/iconConfig';
import { registerSchema, type registerInput } from '../../shared/schemas/authSchemas';
import { ApiError } from '../../shared/services/api/ApiExceptions';
import { RegisterDate } from '../../shared/services/api/register/Register';
import { resolveApiErrorMessage } from '../../shared/utils/apiErrorMessage';
import { displayStrongPassword } from '../../shared/utils/Utils';
import { firebaseAuthSignOut, signInWithGooglePopup } from '../../shared/config/firebase';
import { GoogleLoginDate } from '../../shared/services/api/login/googleLogin';
import { queryKeys } from '../../constant/queryKeys';

export const Register = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  // estado local
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<registerInput>({
    resolver: zodResolver(registerSchema),
  });
  // watch() não pode ser usado dentro de useCallback
  const passwordValue = watch('password') ?? '';
  const strength = displayStrongPassword(passwordValue);

  const onSubmit: SubmitHandler<registerInput> = async (data) => {
    setIsLoading(true);
    setBackendError(null);
    try {
      await RegisterDate.create({
        name: data.name,
        email: data.email,
        password: data.password,
        cep: data.cep,
      });
      reset();
      toast.success('Usuário criado com sucesso');
      navigate('/login');
    } catch (error) {
      const finalError = error instanceof ApiError ? error : new ApiError(500, 'Erro inesperado');

      if (finalError instanceof ApiError) {
        toast.error(
          resolveApiErrorMessage(finalError, {
            404: 'Usuário não foi encontrado ou já foi deletado',
          }),
        );
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fluxo de login com Google (popup)
  const handleGoogleLogin = useCallback(async () => {
    setIsGoogleLoading(true);
    setBackendError(null);
    try {
      const googleCredential = await signInWithGooglePopup();
      const idToken =
        typeof googleCredential === 'string'
          ? googleCredential
          : await googleCredential.user.getIdToken();
      const result = await GoogleLoginDate.create({ idToken });

      if (result instanceof ApiError) {
        if (result.statusCode === 409) {
          setBackendError('Usuário já cadastrado');
          return;
        } else if (result.statusCode === 401) {
          setBackendError('Não foi possível confirmar sua conta Google. Tente novamente');
          return;
        } else {
          setBackendError(result.message);
          return;
        }
      }

      toast('Login realizado');
      queryClient.setQueryData(queryKeys.me, result.user);
      reset();
      navigate('/home');
    } catch (err) {
      console.error('[GoogleLogin] Erro no fluxo de popup:', err);
      setBackendError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      // Limpa sessão do Firebase no cliente — sessão real é o cookie do backend
      await firebaseAuthSignOut();
      setIsGoogleLoading(false);
    }
  }, [navigate, reset, queryClient]);
  // manipula os views da senha e confirmar senha
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);
  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <form
      className="bg-brand-dark flex h-screen flex-col items-center justify-center"
      onSubmit={handleSubmit(onSubmit)} // ← handleSubmit valida antes de chamar onSubmit
    >
      <div className="flex w-100 flex-col items-center justify-center rounded-xl border-[0.5px] border-white/13 px-5 py-3">
        <div className="justify-left third-level flex w-full flex-col gap-1.5 rounded-2xl border-white/13 bg-[#1b1a16] px-5 py-4">
          {/* nome */}
          <Input placeholder="Seu nome" type="text" {...register('name')} disabled={isSubmitting} />
          {errors.name && (
            <p className="text-brand-red mt-1 text-left text-xs font-bold">{errors.name.message}</p>
          )}

          {/* email */}
          <Input placeholder="E-mail" type="email" {...register('email')} disabled={isSubmitting} />
          {errors.email && (
            <p className="mt-0.5 text-left text-xs font-bold text-red-500">
              {errors.email.message}
            </p>
          )}

          <div className="relative flex w-full flex-col">
            {/* password */}
            <Input
              placeholder="Senha"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute top-1/2 right-8 -translate-y-1/2 transform text-gray-500"
              aria-label={showPassword ? 'Mostrar senha' : 'Ocultar senha'}
            >
              {showPassword ? (
                <Eye size={ICON_CONFIG.mnSize} />
              ) : (
                <EyeOff size={ICON_CONFIG.mnSize} />
              )}
            </button>

            <PasswordSuggestionPopover
              onApplyPassword={(password) => {
                setValue('password', password, { shouldValidate: true });
                setValue('confirmPassword', password, { shouldValidate: true });
              }}
            />
          </div>

          {/* só aparece quando o usuário começa a digitar */}
          {passwordValue && (
            <div className="mt-1.5 flex items-center gap-1 px-0.5">
              {strength.bars.map((active) => (
                <div
                  key={active}
                  className="h-0.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: active ? strength.color : 'rgba(255,255,255,0.1)',
                  }}
                />
              ))}
              <span className="ml-1.5 text-[11px] text-white/35">{strength.label}</span>
            </div>
          )}

          {errors.password && (
            <p className="mt-0.5 text-left text-xs font-bold text-red-500">
              {errors.password.message}
            </p>
          )}
          {backendError && (
            <p role="alert" className="text-left text-sm font-bold text-red-500">
              {backendError}
            </p>
          )}
          <div className="relative flex flex-col gap-2">
            {/* div campos formulário */}
            {/* confirmar senha */}
            <Input
              placeholder="Confirme sua senha"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute top-5 right-3 -translate-y-1/2 transform text-gray-500"
              aria-label={showConfirmPassword ? 'Mostrar senha' : 'Ocultar senha'}
            >
              {showConfirmPassword ? (
                <Eye size={ICON_CONFIG.mnSize} />
              ) : (
                <EyeOff size={ICON_CONFIG.mnSize} />
              )}
            </button>
            {errors.confirmPassword && (
              <p className="mt-0.5 text-left text-xs font-bold text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}

            {/* cep */}
            <Input placeholder="Seu CEP" type="text" {...register('cep')} disabled={isSubmitting} />
            <p className="mt-0.5 text-left text-xs text-white/30">formato: 00000-000</p>
            {errors.cep && (
              <p className="mt-0.5 text-left text-xs font-bold text-red-500">
                {errors.cep.message}
              </p>
            )}

            <div className="flex flex-col justify-center">
              <Button
                title={isLoading ? 'Cadastrando' : 'Cadastrar'}
                type="submit"
                colorVariation="bgDarkVariation"
                disabled={isLoading}
                // desabilitar o botão durante o envio dos dados para registro
              />

              <div className="my-1 flex w-full justify-center align-super text-[#595753]">
                <div className="my-2 h-0 w-full border"></div>
                <div className="mx-1 text-sm"> OU </div>
                <div className="my-2 h-0 w-full border"></div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  title={isGoogleLoading ? 'Conectando...' : 'Entrar com Google'}
                  colorVariation="bgGoogleVariation"
                  disabled={isSubmitting || isGoogleLoading}
                  onClick={handleGoogleLogin}
                >
                  <FcGoogle size={ICON_CONFIG.mxSize} />
                </Button>

                <div className="align-center my-1 flex justify-center gap-1">
                  <p className="font-bold text-[#4c4b48]">Já tenho uma conta</p>
                  <Link to={isSubmitting ? '#' : '/login'}>
                    <span
                      className={`text-brand-amber text-right text-sm ${isSubmitting ? 'pointer-events-none cursor-not-allowed opacity-50 select-none' : ''}`}
                    >
                      Entrar
                    </span>
                  </Link>
                  ,
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
