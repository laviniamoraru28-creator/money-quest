'use client';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
export function SupportAdultGate() {
  const t = useTranslations('support');
  const router = useRouter();
  const [challenge, setChallenge] = useState<{a: number; b: number} | null>(null);
  const [answer, setAnswer] = useState('');
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function load() {
    setChallenge(null); setAnswer('');
    try {
      const response = await fetch('/api/support/adult', {cache: 'no-store'});
      if (!response.ok) throw new Error();
      setChallenge(await response.json());
    } catch {setError(t('gateUnavailable'));}
  }
  useEffect(() => {void load(); /* A fresh challenge on each entry. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy || !challenge) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/support/adult', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({answer: answer.trim(), adult})});
      if (!response.ok) {setError(t('gateError')); await load(); return;}
      router.refresh();
    } catch {setError(t('gateUnavailable'));}
    finally {setBusy(false);}
  }
  return <main id="main-content" tabIndex={-1} className="mx-auto max-w-lg px-4 py-10 text-ink">
    <h1 className="font-display text-3xl font-bold">{t('gateTitle')}</h1>
    <p className="mt-4">{t('gateIntro')}</p>
    <form onSubmit={submit} aria-busy={busy} className="mt-6 rounded-2xl border border-teal/20 bg-white p-5">
      <label htmlFor="adult-answer" className="block text-lg font-bold">{t('gateQuestion')}</label>
      <p id="adult-challenge" className="my-4 text-2xl" aria-live="polite">{challenge ? `${challenge.a} × ${challenge.b} = ?` : '…'}</p>
      <input id="adult-answer" aria-describedby="adult-challenge" inputMode="numeric" autoComplete="off" maxLength={3} value={answer} onChange={event => setAnswer(event.target.value)} required className="min-h-12 w-full rounded-lg border border-ink/40 px-3"/>
      <label className="mt-4 flex min-h-12 items-center gap-3"><input type="checkbox" required checked={adult} onChange={event => setAdult(event.target.checked)} className="h-5 w-5 accent-teal"/>{t('adult')}</label>
      <button disabled={busy || !challenge} className="mt-4 min-h-12 w-full rounded-xl bg-teal px-4 py-3 font-bold text-white disabled:opacity-60">{t('gateContinue')}</button>
      {error && <p role="alert" className="mt-4">{error}</p>}
    </form>
    <Link href="/" className="mt-6 inline-flex min-h-12 items-center text-teal-text underline">{t('home')}</Link>
  </main>;
}
