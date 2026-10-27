import type { ManagedUser } from "@/lib/api/users";

/** Row-level operations offered in the users table menu. */
export type UserAction =
  | "edit"
  | "password"
  | "reset"
  | "activate"
  | "deactivate"
  | "delete";

/** The dialog currently open on the users page (if any). */
export interface UserDialogState {
  action: UserAction;
  user: ManagedUser;
}
