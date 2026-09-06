import { compareTasks, type TaskOrderItem } from "domain/tasks";

type Item = Omit<TaskOrderItem, "id"> & { _id: string };
export function compareTaskItems<T extends Item>(a: T, b: T): number {
  return compareTasks({ ...a, id: a._id }, { ...b, id: b._id });
}
