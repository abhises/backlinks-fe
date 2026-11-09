'use client';
import { MediaLibrary } from '@/components/admin/blog/shared';
import a from '@/components/admin/blog/adminBlog.module.css';

export default function BlogMediaPage() {
  return (
    <>
      <div className={a.head}><h1>Media</h1></div>
      <MediaLibrary />
    </>
  );
}
