/**
 * Countries Money Quest can confidently map to a launch currency at
 * onboarding. This list intentionally does NOT try to cover every country
 * in the world — offering a country with no currency mapping would either
 * silently guess wrong or block onboarding, both worse than a clear, honest
 * list. A country not shown here can still be added by a parent picking
 * their currency directly on the next step (see /onboarding/currency).
 */

export interface CountryOption {
  countryCode: string;
  countryName: string;
  currencyCode: string;
}

export const COUNTRIES: CountryOption[] = [
  { countryCode: "AU", countryName: "Australia", currencyCode: "AUD" },
  { countryCode: "AT", countryName: "Austria", currencyCode: "EUR" },
  { countryCode: "BE", countryName: "Belgium", currencyCode: "EUR" },
  { countryCode: "CA", countryName: "Canada", currencyCode: "CAD" },
  { countryCode: "HR", countryName: "Croatia", currencyCode: "EUR" },
  { countryCode: "CY", countryName: "Cyprus", currencyCode: "EUR" },
  { countryCode: "EE", countryName: "Estonia", currencyCode: "EUR" },
  { countryCode: "FI", countryName: "Finland", currencyCode: "EUR" },
  { countryCode: "FR", countryName: "France", currencyCode: "EUR" },
  { countryCode: "DE", countryName: "Germany", currencyCode: "EUR" },
  { countryCode: "GR", countryName: "Greece", currencyCode: "EUR" },
  { countryCode: "IE", countryName: "Ireland", currencyCode: "EUR" },
  { countryCode: "IT", countryName: "Italy", currencyCode: "EUR" },
  { countryCode: "JP", countryName: "Japan", currencyCode: "JPY" },
  { countryCode: "LV", countryName: "Latvia", currencyCode: "EUR" },
  { countryCode: "LT", countryName: "Lithuania", currencyCode: "EUR" },
  { countryCode: "LU", countryName: "Luxembourg", currencyCode: "EUR" },
  { countryCode: "MT", countryName: "Malta", currencyCode: "EUR" },
  { countryCode: "NL", countryName: "Netherlands", currencyCode: "EUR" },
  { countryCode: "PT", countryName: "Portugal", currencyCode: "EUR" },
  { countryCode: "RO", countryName: "Romania", currencyCode: "RON" },
  { countryCode: "SK", countryName: "Slovakia", currencyCode: "EUR" },
  { countryCode: "SI", countryName: "Slovenia", currencyCode: "EUR" },
  { countryCode: "ES", countryName: "Spain", currencyCode: "EUR" },
  { countryCode: "CH", countryName: "Switzerland", currencyCode: "CHF" },
  { countryCode: "GB", countryName: "United Kingdom", currencyCode: "GBP" },
  { countryCode: "US", countryName: "United States", currencyCode: "USD" },
];
