import type { Category } from "@/app/_data/category";
import { Card } from "@/components/ui/card";
import DeleteCategoryButton from "./delete-category-button";
import EditCategoryButton from "./edit-category-button";

export default function Category({ category }: { category: Category }) {
  return (
    <Card className="flex flex-row items-center justify-between gap-2 px-4 py-2">
      <div className="flex flex-col gap-1">
        {category.name}
        <span className="text-sm text-muted-foreground">
          {category.items.length} elements
        </span>
      </div>

      <div className="flex flex-row items-center gap-2">
        <EditCategoryButton category={category} />
        <DeleteCategoryButton category={category} />
      </div>
    </Card>
  );
}
