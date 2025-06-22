import { getCredentials } from "../../actions/credentials";
import CredentialsClient from "./CredentialsClient";

export default async function CredentialsPage() {
  // READ: Fetch credentials directly in this Server Component
  const credentials = await getCredentials();

  return (
    <CredentialsClient 
      initialCredentials={credentials}
    />
  );
}
