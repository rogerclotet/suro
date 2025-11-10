import { Info } from "lucide-react";
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
      <NewCategoryButton />

      {categories.length === 0 ? (
        <Description>
          <p className="mt-4 text-muted-foreground">
            Encara no hi ha categories
          </p>
        </Description>
      ) : (
        <>
          <Description />

          <ul className="mx-auto max-w-xl space-y-2">
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

function Description({ children }: { children?: React.ReactNode }) {
  const description = `Les categories són útils per organitzar les llistes. 
    Pots classificar els elements d'una llista de manera que quedin agrupats i siguin més fàcils de trobar.`;

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Informació</AlertTitle>
      <AlertDescription className="space-y-2">
        {children}
        <p>{description}</p>
      </AlertDescription>
    </Alert>
  );
}
