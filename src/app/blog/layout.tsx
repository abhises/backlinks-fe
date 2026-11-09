import { BlogHeader, BlogFooter } from '@/components/blog/BlogChrome';
import { getBlogHome, styleHtml } from '@/lib/blog';
import { blogFontVars } from './fonts';
import s from './blog.module.css';

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getBlogHome();
  return (
    <div className={`${s.root} ${blogFontVars}`}>
      {settings.customCss && <style dangerouslySetInnerHTML={styleHtml(settings.customCss)} />}
      <BlogHeader />
      {children}
      <BlogFooter title={settings.newsletterTitle} text={settings.newsletterText} />
    </div>
  );
}
