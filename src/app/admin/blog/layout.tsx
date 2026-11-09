import { BlogSideNav } from '@/components/admin/blog/shared';
import a from '@/components/admin/blog/adminBlog.module.css';

export default function AdminBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={a.layout}>
      <BlogSideNav />
      <div className={a.wrap}>{children}</div>
    </div>
  );
}
