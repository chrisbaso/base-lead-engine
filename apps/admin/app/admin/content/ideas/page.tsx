import { AdminShell, EmptyState } from "../../../admin-shell";
import { createContentIdeaAction } from "../../../actions";
import { getContentIdeas, resolveAdminTenant } from "../../../data";

type IdeasPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

export default async function ContentIdeasPage({ searchParams }: IdeasPageProps) {
  const params = await searchParams;
  const tenant = resolveAdminTenant(params.tenant ?? "retire-ready-mn");
  const ideas = await getContentIdeas(tenant);

  return (
    <AdminShell selectedTenantSlug={tenant.identity.slug}>
      <section>
        <h2>New Content Idea</h2>
        <form className="admin-form-row content-idea-form" action={createContentIdeaAction}>
          <input type="hidden" name="tenantSlug" value={tenant.identity.slug} />
          <input name="topic" placeholder="Topic" />
          <input name="category" placeholder="Category" />
          <input name="targetKeyword" placeholder="Target keyword" />
          <select name="priority" defaultValue="medium" aria-label="Priority">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input name="notes" placeholder="Notes or prompt angle" />
          <button type="submit">Add idea</button>
        </form>
      </section>

      <section>
        <h2>Idea Backlog</h2>
        {ideas.status === "unavailable" ? (
          <EmptyState title="Ideas unavailable" body={ideas.reason} />
        ) : ideas.data.length === 0 ? (
          <EmptyState title="No ideas yet" body="Add topics for the AI content workflow to draft and review." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Keyword</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {ideas.data.map((idea) => (
                  <tr key={idea.id}>
                    <td>{idea.topic}</td>
                    <td>{idea.category}</td>
                    <td>{idea.status}</td>
                    <td>{idea.priority}</td>
                    <td>{idea.target_keyword ?? "None"}</td>
                    <td>{idea.updated_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
