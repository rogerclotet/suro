import { checkAuth } from "@/lib/check-auth";
import CategoriesList from "./_components/categories-list";
import NewCategoryButton from "./_components/new-category-button";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;

  return (
    <div className="space-y-4">
      <NewCategoryButton />
      <CategoriesList projectId={projectId} />
    </div>
  );
}
