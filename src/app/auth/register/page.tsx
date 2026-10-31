'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, Check, Search, Hammer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingOverlay } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { normalizeCameroonPhone } from '@/utils/phone';
import { categoryApi, providerApi } from '@/services/api';
import type { Role, Gender } from '@/types';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'firstNameRequired').min(2, 'firstNameTooShort'),
    lastName: z.string().min(1, 'lastNameRequired').min(2, 'lastNameTooShort'),
    email: z.string().min(1, 'emailRequired').email('emailInvalid'),
    phone: z.string().min(1, 'phoneRequired').refine((v) => normalizeCameroonPhone(v) !== null, 'phoneInvalid'),
    password: z.string().min(1, 'passwordRequired').min(6, 'passwordTooShort'),
    gender: z.enum(['HOMME', 'FEMME'], { message: 'genderRequired' }),
    city: z.string().min(1, 'cityRequired'),
    role: z.enum(['CLIENT', 'PROVIDER']),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'termsRequired',
    }),
    // Provider-only fields
    categoryId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    startingPrice: z.string().optional(),
    availability: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role !== 'PROVIDER') return;
    if (!data.categoryId) {
      ctx.addIssue({ code: 'custom', path: ['categoryId'], message: 'categoryRequired' });
    }
    if (!data.title || data.title.trim().length < 3) {
      ctx.addIssue({ code: 'custom', path: ['title'], message: 'titleRequired' });
    }
    if (!data.description || data.description.trim().length < 20) {
      ctx.addIssue({ code: 'custom', path: ['description'], message: 'descriptionRequired' });
    }
    const price = Number(data.startingPrice);
    if (!data.startingPrice || Number.isNaN(price) || price <= 0) {
      ctx.addIssue({ code: 'custom', path: ['startingPrice'], message: 'priceInvalid' });
    }
    if (!data.availability || data.availability.trim().length < 3) {
      ctx.addIssue({ code: 'custom', path: ['availability'], message: 'availabilityRequired' });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const STEP_1_FIELDS: (keyof RegisterFormValues)[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'gender',
  'city',
  'password',
  'acceptTerms',
];

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [redirecting, setRedirecting] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      gender: undefined,
      city: '',
      role: 'CLIENT',
      acceptTerms: false,
      categoryId: '',
      title: '',
      description: '',
      startingPrice: '',
      availability: '',
    },
  });

  // Le lien « Devenir prestataire » arrive avec ?role=provider
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('role') === 'provider') setValue('role', 'PROVIDER');
  }, [setValue]);

  const selectedRole = watch('role');
  const acceptTerms = watch('acceptTerms');
  const isProvider = selectedRole === 'PROVIDER';

  const setRole = (role: 'CLIENT' | 'PROVIDER') => {
    setValue('role', role);
    setStep(1);
  };

  const goToStep2 = async () => {
    const valid = await trigger(STEP_1_FIELDS);
    if (valid) {
      setServerError(null);
      setStep(2);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: normalizeCameroonPhone(data.phone) ?? data.phone,
        password: data.password,
        gender: data.gender as Gender,
        role: data.role as Role,
        city: data.city,
      });

      if (data.role === 'PROVIDER') {
        await providerApi.becomeProvider({
          categoryId: data.categoryId!,
          title: data.title!.trim(),
          description: data.description!.trim(),
          startingPrice: Number(data.startingPrice),
          city: data.city,
          availability: data.availability!.trim(),
        });
        setRedirecting(true);
        router.push('/dashboard/provider');
      } else {
        setRedirecting(true);
        router.push('/dashboard/client');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setServerError(axiosError?.response?.data?.message || t('genericError'));
    }
  };

  return (
    <div className="relative flex flex-col gap-6">
      {(isSubmitting || redirecting) && (
        <LoadingOverlay
          label={isProvider ? t('creatingProvider') : t('creatingAccount')}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Choix du profil : deux cartes radio plutôt qu'un simple interrupteur */}
      <fieldset>
        <legend className="sr-only">{t('roleLegend')}</legend>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'CLIENT', icon: Search, title: t('roleClient'), hint: t('roleClientHint') },
            { value: 'PROVIDER', icon: Hammer, title: t('roleProvider'), hint: t('roleProviderHint') },
          ] as const).map((opt) => {
            const active = selectedRole === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRole(opt.value)}
                className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                  active
                    ? 'border-brand-700 bg-brand-50 ring-1 ring-brand-700 dark:border-brand-300 dark:bg-brand-900/40 dark:ring-brand-300'
                    : 'border-border hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    active ? 'bg-sun-400 text-gray-950' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <opt.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-[15px] font-semibold">{opt.title}</span>
                <span className="text-[13px] leading-snug text-muted-foreground">{opt.hint}</span>
                {active && <Check className="absolute right-3 top-3 h-4 w-4 text-brand-700 dark:text-brand-300" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Step indicator (provider only) */}
      {isProvider && (
        <div className="flex items-center gap-3">
          <StepBadge index={1} label={t('stepAccount')} active={step === 1} done={step > 1} />
          <div className={`h-px flex-1 ${step > 1 ? 'bg-brand-600' : 'bg-border'}`} />
          <StepBadge index={2} label={t('stepActivity')} active={step === 2} done={false} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {serverError}
          </div>
        )}

        {/* ---------- STEP 1: personal info ---------- */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="firstName">{t('firstName')}</Label>
                <Input id="firstName" placeholder={t('firstNamePlaceholder')} error={!!errors.firstName} {...register('firstName')} />
                {errors.firstName && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.firstName.message as string)}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lastName">{t('lastName')}</Label>
                <Input id="lastName" placeholder={t('lastNamePlaceholder')} error={!!errors.lastName} {...register('lastName')} />
                {errors.lastName && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.lastName.message as string)}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" type="email" placeholder={t('emailPlaceholder')} error={!!errors.email} {...register('email')} />
              {errors.email && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.email.message as string)}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">{t('phone')}</Label>
              <Input id="phone" type="tel" placeholder={t('phonePlaceholder')} error={!!errors.phone} {...register('phone')} />
              {errors.phone && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.phone.message as string)}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gender">{t('gender')}</Label>
                <select
                  id="gender"
                  className={`flex h-11 w-full rounded-lg border bg-transparent px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-brand-600 focus-visible:ring-1 focus-visible:ring-brand-600 ${
                    errors.gender ? 'border-red-500' : 'border-border'
                  }`}
                  {...register('gender')}
                >
                  <option value="">{t('genderSelect')}</option>
                  <option value="HOMME">{t('genderMale')}</option>
                  <option value="FEMME">{t('genderFemale')}</option>
                </select>
                {errors.gender && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.gender.message as string)}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">{t('city')}</Label>
                <Input id="city" placeholder={t('cityPlaceholder')} error={!!errors.city} {...register('city')} />
                {errors.city && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.city.message as string)}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('passwordPlaceholder')}
                  className="pr-10"
                  error={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.password.message as string)}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={acceptTerms}
                  onClick={() => setValue('acceptTerms', !acceptTerms, { shouldValidate: true })}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    acceptTerms
                      ? 'border-brand-600 bg-brand-600'
                      : errors.acceptTerms
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {acceptTerms && (
                    <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-muted-foreground leading-snug">
                  {t('acceptPrefix')}{' '}
                  <Link href="/#conditions" className="text-brand-700 underline underline-offset-2 dark:text-brand-300">
                    {t('acceptTerms')}
                  </Link>{' '}
                  {t('acceptAnd')}{' '}
                  <Link href="/#confidentialite" className="text-brand-700 underline underline-offset-2 dark:text-brand-300">
                    {t('acceptPrivacy')}
                  </Link>
                </span>
              </div>
              {errors.acceptTerms && <p className="text-[13px] text-red-600 dark:text-red-300 ml-6">{t(errors.acceptTerms.message as string)}</p>}
            </div>

            {isProvider ? (
              <Button type="button" onClick={goToStep2} className="h-11 w-full mt-1">
                {t('continue')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" className="h-11 w-full mt-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  t('submit')
                )}
              </Button>
            )}
          </>
        )}

        {/* ---------- STEP 2: activity info (provider) ---------- */}
        {step === 2 && isProvider && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoryId">{t('category')}</Label>
              <select
                id="categoryId"
                className={`flex h-11 w-full rounded-lg border bg-transparent px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:border-brand-600 focus-visible:ring-1 focus-visible:ring-brand-600 ${
                  errors.categoryId ? 'border-red-500' : 'border-border'
                }`}
                {...register('categoryId')}
              >
                <option value="">{t('categorySelect')}</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.categoryId.message as string)}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">{t('activityTitle')}</Label>
              <Input
                id="title"
                placeholder={t('activityTitlePlaceholder')}
                error={!!errors.title}
                {...register('title')}
              />
              {errors.title && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.title.message as string)}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">{t('description')}</Label>
              <textarea
                id="description"
                rows={4}
                placeholder={t('descriptionPlaceholder')}
                className={`flex w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:border-brand-600 focus-visible:ring-1 focus-visible:ring-brand-600 resize-none ${
                  errors.description ? 'border-red-500' : 'border-border'
                }`}
                {...register('description')}
              />
              {errors.description && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.description.message as string)}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startingPrice">{t('startingPrice')}</Label>
                <Input
                  id="startingPrice"
                  type="number"
                  min="0"
                  placeholder="5000"
                  error={!!errors.startingPrice}
                  {...register('startingPrice')}
                />
                {errors.startingPrice && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.startingPrice.message as string)}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="availability">{t('availability')}</Label>
                <Input
                  id="availability"
                  placeholder={t('availabilityPlaceholder')}
                  error={!!errors.availability}
                  {...register('availability')}
                />
                {errors.availability && <p className="text-[13px] text-red-600 dark:text-red-300">{t(errors.availability.message as string)}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-11 flex-1"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </Button>
              <Button type="submit" className="h-11 flex-[2]" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  t('submitProvider')
                )}
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link href="/auth/login" className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300">
          {t('login')}
        </Link>
      </p>
    </div>
  );
}

function StepBadge({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
          done
            ? 'bg-brand-600 text-white'
            : active
              ? 'bg-brand-600 text-white'
              : 'bg-muted text-gray-400'
        }`}
      >
        {done ? <Check className="h-4 w-4" /> : index}
      </div>
      <span className={`text-sm font-medium ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
