-- Money Quest — 0003_seed_currencies.sql
-- Seeds the 7 launch currencies from the currency architecture doc.

insert into public.currencies
  (code, name, symbol, symbol_position, locale, minor_unit_digits,
   decimal_separator, thousands_separator, cash_rounding_increment,
   price_tier_xs, price_tier_s, price_tier_m, price_tier_l, price_tier_xl)
values
  ('GBP', 'British Pound Sterling', '£', 'before', 'en-GB', 2, '.', ',', null, 0.5, 1.5, 5.0, 15.0, 40.0),
  ('USD', 'US Dollar', '$', 'before', 'en-US', 2, '.', ',', null, 0.75, 2.0, 6.0, 18.0, 50.0),
  ('EUR', 'Euro', '€', 'before', 'de-DE', 2, ',', '.', null, 0.6, 1.8, 5.5, 16.0, 45.0),
  ('CAD', 'Canadian Dollar', '$', 'before', 'en-CA', 2, '.', ',', null, 1.0, 2.5, 7.5, 22.0, 60.0),
  ('AUD', 'Australian Dollar', '$', 'before', 'en-AU', 2, '.', ',', 0.05, 1.0, 2.5, 8.0, 24.0, 65.0),
  ('CHF', 'Swiss Franc', 'CHF', 'before', 'de-CH', 2, '.', '''', 0.05, 1.0, 2.5, 7.0, 20.0, 55.0),
  ('JPY', 'Japanese Yen', '¥', 'before', 'ja-JP', 0, '.', ',', null, 100, 250, 750, 2200, 6000);

insert into public.currency_regions (currency_code, country_name, country_code, is_primary) values
  ('GBP', 'United Kingdom', 'GB', true),
  ('USD', 'United States', 'US', true),
  ('EUR', 'Germany', 'DE', true),
  ('EUR', 'France', 'FR', true),
  ('EUR', 'Ireland', 'IE', true),
  ('EUR', 'Spain', 'ES', true),
  ('EUR', 'Italy', 'IT', true),
  ('EUR', 'Netherlands', 'NL', true),
  ('EUR', 'Portugal', 'PT', true),
  ('EUR', 'Belgium', 'BE', true),
  ('EUR', 'Austria', 'AT', true),
  ('EUR', 'Greece', 'GR', true),
  ('EUR', 'Finland', 'FI', true),
  ('EUR', 'Luxembourg', 'LU', true),
  ('EUR', 'Slovenia', 'SI', true),
  ('EUR', 'Slovakia', 'SK', true),
  ('EUR', 'Estonia', 'EE', true),
  ('EUR', 'Latvia', 'LV', true),
  ('EUR', 'Lithuania', 'LT', true),
  ('EUR', 'Cyprus', 'CY', true),
  ('EUR', 'Malta', 'MT', true),
  ('EUR', 'Croatia', 'HR', true),
  ('CAD', 'Canada', 'CA', true),
  ('AUD', 'Australia', 'AU', true),
  ('CHF', 'Switzerland', 'CH', true),
  ('JPY', 'Japan', 'JP', true);
