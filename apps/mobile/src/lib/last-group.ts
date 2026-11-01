import { deleteRaw, QUERY_PREFIX, readRaw, writeRaw } from "./offline/storage";

// Under the query cache's prefix, so signing out or switching accounts clears
// it along with the rest of the account's cached data.
const LAST_GROUP_KEY = `${QUERY_PREFIX}last-group`;

/** The group the user last had open, which launch reopens. */
export function lastGroupId(): string | undefined {
  return readRaw(LAST_GROUP_KEY);
}

export function rememberGroup(projectId: string) {
  if (readRaw(LAST_GROUP_KEY) !== projectId) {
    writeRaw(LAST_GROUP_KEY, projectId);
  }
}

/** Stop reopening a group the user no longer belongs to. */
export function forgetGroup(projectId: string) {
  if (readRaw(LAST_GROUP_KEY) === projectId) {
    deleteRaw(LAST_GROUP_KEY);
  }
}
