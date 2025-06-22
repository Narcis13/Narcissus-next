// db/schema/index.ts
import * as postsSchema from "./posts";
import * as commentsSchema from "./comments";
import * as usersSchema from "./users";
import * as credentialsSchema from "./credentials";

// Combine all schemas into a single object
export const schema = {
  ...postsSchema,
  ...commentsSchema,
  ...usersSchema,
  ...credentialsSchema,
};