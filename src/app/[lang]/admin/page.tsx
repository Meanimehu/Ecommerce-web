import { notFound } from 'next/navigation';
import { getMessages, isLocale } from '@/lib/i18n';

/** Admin home (Document 5, section 8.3). Its links arrive with the admin screens from Slice 2. */
export default async function AdminHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getMessages(lang);
  return (
    <div className="grid max-w-[72ch] gap-2">
      <h1 className="type-h2 text-ink stitch-bottom pb-3">{t.areas.adminHome}</h1>
      <p>{t.areas.adminIntro}</p>
    </div>
  );
}
