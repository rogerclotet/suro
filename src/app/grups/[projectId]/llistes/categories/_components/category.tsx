import type { Category as CategoryType } from "@/app/_data/category";
import { Card } from "@/components/ui/card";
import DeleteCategoryButton from "./delete-category-button";
import EditCategoryButton from "./edit-category-button";

export default function Category({ category }: { category: CategoryType }) {
  return (
    <Card className="flex flex-row items-center justify-between gap-2 px-4 py-2">
      <div className="flex flex-col gap-1">
        {category.name}
        <span className="text-muted-foreground text-sm">
          {category.items.length}{" "}
          {category.items.length === 1 ? "element" : "elements"}
        </span>
      </div>

      <div className="flex flex-row items-center gap-2">
        <EditCategoryButton category={category} />
        <DeleteCategoryButton category={category} />
      </div>
    </Card>
  );
}
