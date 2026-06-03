import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    setErr('');
    try {
      const { data } = await api.get('/api/admin/users', { params: { search } });
      setUsers(data.users || []);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setRole = async (id, role) => {
    setErr('');
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role });
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-100 sm:text-2xl">Admin</h1>
        <p className="mt-1 text-xs text-terminal-muted sm:text-sm">Assign Premium or Admin roles. First admin must be promoted in MongoDB.</p>
      </div>
      {err && <div className="break-words text-sm text-red-400">{err}</div>}

      <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-sm outline-none focus:border-terminal-accent"
          placeholder="Search email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          onClick={load}
          className="shrink-0 rounded bg-terminal-accent/20 px-4 py-2 text-sm text-terminal-accent ring-1 ring-terminal-accent/40"
        >
          Search
        </button>
      </div>

      <div className="min-w-0 overflow-x-auto rounded-xl border border-terminal-border">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="bg-terminal-panel text-terminal-muted">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-terminal-border">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2 capitalize">{u.role}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                  {['free', 'premium', 'admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="rounded border border-terminal-border px-2 py-1 text-[10px] hover:border-terminal-accent/50 sm:text-xs"
                      onClick={() => setRole(u.id, r)}
                    >
                      Set {r}
                    </button>
                  ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
