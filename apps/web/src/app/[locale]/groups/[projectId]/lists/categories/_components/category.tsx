import type { Category as CategoryType } from "@/app/_data/category";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import DeleteCategoryButton from "./delete-category-button";
import EditCategoryButton from "./edit-category-button";

export default function Category({
  category,
}: {
  category: CategoryType & { itemCount: number };
}) {
  return (
    <Item variant="card">
      <ItemContent>
        <ItemTitle>{category.name}</ItemTitle>
        <ItemDescription>
          {category.itemCount}{" "}
          {category.itemCount === 1 ? "element" : "elements"}
        </ItemDescription>
      </ItemContent>

      <ItemActions>
        <EditCategoryButton category={category} />
        <DeleteCategoryButton category={category} />
      </ItemActions>
    </Item>
  );
}
