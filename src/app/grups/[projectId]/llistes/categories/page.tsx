import { CornerRightUp, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { checkAuth } from "@/lib/check-auth";
import { getCategories } from "@/server/categories";
import Category from "./_components/category";
import NewCategoryButton from "./_components/new-category-button";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await checkAuth();

  const { projectId } = await params;

  const categories = await getCategories(projectId);

  return (
    <div className="space-y-4">
      {/* TODO Move to sidebar */}
      <NewCategoryButton />

      {categories.length === 0 ? (
        <>
          <div className="mb-4 flex flex-row items-center justify-end gap-4 pr-8 text-right sm:pr-16">
            Encara no hi ha categories, en pots crear aquí{" "}
            <CornerRightUp className="mb-4 shrink-0" />
          </div>

          <Description />
        </>
      ) : (
        <>
          <Description />

          <ul className="mx-auto max-w-xl space-y-4">
            {categories.map((category) => (
              <li key={category.id}>
                <Category category={category} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Description() {
  const description = `Les categories són útils per organitzar les llistes. 
    Pots classificar els elements d'una llista de manera que quedin agrupats i siguin més fàcils de trobar.`;

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Informació</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
