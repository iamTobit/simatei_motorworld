import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ErrorState, FieldError, RowsSkeleton } from "@/components/common/states";
import * as authApi from "@/lib/api/auth";
import { ApiError, errorMessage, fieldErrorsOf } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account/")({
  head: () => ({
    meta: [
      { title: "Your profile — Simatei Motorworld" },
      { name: "description", content: "Update your name and phone number and review your account details." },
      { property: "og:title", content: "Your profile — Simatei Motorworld" },
      {
        property: "og:description",
        content: "Update your name and phone number and review your account details.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<unknown>(null);

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => authApi.getProfile(),
  });

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.user.name);
      setPhone(profile.data.user.phone ?? "");
      setUser(profile.data.user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.data]);

  const mutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile({ name: name.trim(), phone: phone.trim() ? phone.trim() : null }),
    onSuccess: (response) => {
      setError(null);
      setUser(response.user);
      toast.success("Profile updated");
      void profile.refetch();
    },
    onError: (caught) => {
      setError(caught);
      toast.error(errorMessage(caught));
    },
  });

  const fieldErrors = fieldErrorsOf(error);

  if (profile.isPending) return <RowsSkeleton rows={4} />;
  if (profile.isError) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }

  const user = profile.data.user;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl heading-xl">Personal details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your email address can't be changed here — contact an administrator if it's wrong.
        </p>

        {error ? (
          <Alert variant="destructive" className="mt-5">
            <AlertDescription>{errorMessage(error)}</AlertDescription>
          </Alert>
        ) : null}

        <form
          className="mt-6 space-y-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) {
              setError(new ApiError("Please fix the highlighted fields.", 400, {
                name: ["Enter your full name"],
              }));
              return;
            }
            setError(null);
            mutation.mutate();
          }}
        >
          <div>
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(fieldErrors["name"])}
              className="mt-1.5"
            />
            <FieldError messages={fieldErrors["name"]} />
          </div>

          <div>
            <Label htmlFor="profile-phone">
              Phone <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-invalid={Boolean(fieldErrors["phone"])}
              className="mt-1.5"
            />
            <FieldError messages={fieldErrors["phone"]} />
          </div>

          <div>
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={user.email} readOnly disabled className="mt-1.5" />
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Save changes
          </Button>
        </form>
      </section>

      <aside className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Account status</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Role</dt>
            <dd>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role === "admin" ? "Administrator" : "Member"}
              </Badge>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{formatDate(user.created_at)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Standing</dt>
            <dd>{user.is_blocked ? "Blocked" : "Good standing"}</dd>
          </div>
        </dl>

        {user.is_blocked ? (
          <Alert variant="destructive" className="mt-5">
            <ShieldAlert className="size-4" aria-hidden="true" />
            <AlertDescription>
              This account is blocked. Contact an administrator to restore access.
            </AlertDescription>
          </Alert>
        ) : null}
      </aside>
    </div>
  );
}
