import { PostEditor } from '@/components/admin/blog/PostEditor';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostEditor key={id} id={id} />;
}
