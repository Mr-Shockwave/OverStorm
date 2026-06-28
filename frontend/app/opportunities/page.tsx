import { redirect } from "next/navigation";

type OpportunitiesRedirectPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function OpportunitiesRedirectPage({
  searchParams,
}: OpportunitiesRedirectPageProps) {
  const params = await searchParams;

  if (params.id) {
    redirect(`/agents?id=${params.id}`);
  }

  redirect("/agents");
}
