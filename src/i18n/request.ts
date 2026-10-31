import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from './locale';

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  return {
    locale,
    timeZone: 'Africa/Douala',
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
