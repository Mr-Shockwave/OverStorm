import { redirect } from "next/navigation";

type AgentsRedirectPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AgentsRedirectPage({
  searchParams,
}: AgentsRedirectPageProps) {
  const params = await searchParams;

  if (params.id) {
    redirect(`/opportunities?id=${params.id}`);
  }

  redirect("/opportunities");
}
