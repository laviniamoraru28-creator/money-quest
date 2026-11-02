import copy from './live-shop-copy.json';
import type {Locale} from '@/i18n/config';
export const liveShopCopy=copy satisfies Record<Locale,Record<keyof typeof copy.en,string>>;
