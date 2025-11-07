"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/app/providers/AuthProvider";
import { api, type TeamMember } from "@/lib/api";
import { Button } from "@/components/ui/button";

const roles: Array<{ value: "MANAGER" | "MEDEWERKER"; label: string }> = [
  { value: "MANAGER", label: "Manager" },
  { value: "MEDEWERKER", label: "Medewerker" },
];

export default function TeamPage() {
  const { isManager, authenticatedUser } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "MEDEWERKER">("MEDEWERKER");

  useEffect(() => {
    if (!isManager) {
      router.replace("/dashboard");
    }
  }, [isManager, router]);

  useEffect(() => {
    if (!isManager) {
      return;
    }
    let mounted = true;
    setError(null);
    setLoading(true);
    api
      .teamList()
      .then((data) => {
        if (!mounted) return;
        setMembers(data);
      })
      .catch((err: any) => {
        if (!mounted) return;
        setError(err.message ?? "Kon teamleden niet laden");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isManager]);

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setError(null);
    try {
      const response = await api.teamInvite(inviteEmail, inviteRole);
      setMembers((prev) =>
        prev.some((member) => member.id === response.id)
          ? prev.map((member) => (member.id === response.id ? response : member))
          : [...prev, response],
      );
      setInviteEmail("");
    } catch (err: any) {
      setError(err.message ?? "Kon uitnodiging niet versturen");
    }
  };

  const updateRole = async (userId: string, role: "MANAGER" | "MEDEWERKER") => {
    setError(null);
    try {
      const updated = await api.teamUpdateRole(userId, role);
      setMembers((prev) => prev.map((member) => (member.id === updated.id ? updated : member)));
    } catch (err: any) {
      setError(err.message ?? "Kon rol niet wijzigen");
    }
  };

  const removeMember = async (userId: string) => {
    if (!confirm("Weet je zeker dat je dit teamlid wilt verwijderen?")) return;
    setError(null);
    try {
      await api.teamRemove(userId);
      setMembers((prev) => prev.filter((member) => member.id !== userId));
    } catch (err: any) {
      setError(err.message ?? "Kon teamlid niet verwijderen");
    }
  };

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) =>
        a.createdAt === b.createdAt ? a.email.localeCompare(b.email) : a.createdAt.localeCompare(b.createdAt),
      ),
    [members],
  );

  if (!isManager) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team</h1>
          <p className="text-slate-600">Nodig medewerkers uit, beheer rollen en houd overzicht.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
          Terug naar dashboard
        </Link>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Teamlid uitnodigen</h2>
        <p className="text-sm text-slate-600">
          De medewerker ontvangt een e-mail met instructies om een wachtwoord in te stellen.
        </p>
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
          <input
            className="flex-1 rounded border p-2"
            type="email"
            placeholder="E-mailadres"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
          />
          <select
            className="rounded border p-2 text-sm"
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as "MANAGER" | "MEDEWERKER")}
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <Button onClick={() => void invite()}>Versturen</Button>
        </div>
      </section>

      <section className="rounded border bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium">Teamleden</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Laden...</p>
        ) : sortedMembers.length === 0 ? (
          <p className="text-sm text-slate-500">Nog geen teamleden. Nodig iemand uit.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">E-mailadres</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Sinds</th>
                  <th className="px-3 py-2 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-3 py-2">{member.email}</td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded border p-1 text-sm"
                        value={member.role}
                        disabled={member.id === authenticatedUser?.id}
                        onChange={(event) =>
                          void updateRole(member.id, event.target.value as "MANAGER" | "MEDEWERKER")
                        }
                      >
                        {roles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-500 disabled:text-slate-400"
                        disabled={member.id === authenticatedUser?.id}
                        onClick={() => void removeMember(member.id)}
                      >
                        Verwijderen
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

