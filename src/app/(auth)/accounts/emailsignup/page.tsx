"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera } from "lucide-react";
import { api, BASE_PATH } from "@/lib/client";
import { AuthInput, Divider } from "@/components/auth-form";
import { Logo } from "@/components/nav";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const additional = searchParams.get("add") === "1";
  const returnTo = searchParams.get("returnTo");
  const [form, setForm] = useState({ email: "", phone: "", password: "", name: "", lastName: "", username: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: k === "username" ? v.toLowerCase().replace(/\s/g, "") : v }));

  const valid = {
    email: /^\S+@\S+\.\S+$/.test(form.email),
    phone: /^\+?[0-9\s()-]{7,20}$/.test(form.phone),
    password: form.password.length >= 8,
    username: /^[a-z0-9._]{1,30}$/.test(form.username),
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (avatar) body.append("avatar", avatar);
      await api("/api/auth/signup", { body });
      window.location.replace(`${BASE_PATH}/`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-[350px]">
      <div className="mb-2.5 border-separator px-10 pb-6 pt-10 sm:border">
        <button type="button" onClick={() => router.push(additional && returnTo?.startsWith("/") ? returnTo : additional ? "/" : "/accounts/login")} className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
          <ArrowLeft size={18} /> {additional ? "Back to existing account" : "Back"}
        </button>
        <h1 className="mb-3 mt-2 text-center">
          <Logo className="text-[46px]" />
        </h1>
        <p className="mb-2 text-center text-base font-semibold text-muted">
          {additional ? "Create another shalter account." : "Sign up to see photos and videos from your friends."}
        </p>
        <Divider />
        <form onSubmit={submit} className="flex flex-col gap-1.5">
          <label className="mx-auto mb-2 flex cursor-pointer flex-col items-center gap-2 text-xs font-semibold text-link">
            <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-field ring-1 ring-border">
              {avatarPreview ? <Image src={avatarPreview} alt="Profile preview" width={80} height={80} unoptimized className="h-full w-full object-cover" /> : <Camera size={27} className="text-muted" />}
            </span>
            {avatar ? "Change profile photo" : "Add profile photo"}
            <input hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setAvatar(file);
              if (!file) { setAvatarPreview(null); return; }
              const reader = new FileReader();
              reader.onload = () => setAvatarPreview(typeof reader.result === "string" ? reader.result : null);
              reader.readAsDataURL(file);
              event.target.value = "";
            }} />
          </label>
          <AuthInput label="Email" value={form.email} onChange={set("email")} type="email" autoComplete="email" valid={valid.email} />
          <AuthInput label="Phone number" value={form.phone} onChange={set("phone")} autoComplete="tel" valid={valid.phone} />
          <AuthInput label="Password" type="password" value={form.password} onChange={set("password")} autoComplete="new-password" valid={valid.password} />
          <AuthInput label="Full Name" value={form.name} onChange={set("name")} autoComplete="name" />
          <AuthInput label="Last Name (optional)" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" />
          <AuthInput label="Username" value={form.username} onChange={set("username")} autoComplete="username" valid={valid.username} />
          <p className="my-2.5 text-center text-xs text-muted">
            By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
          </p>
          <button
            disabled={!valid.email || !valid.phone || !valid.password || !valid.username || busy}
            className="rounded-lg bg-link py-[7px] text-sm font-semibold text-white hover:bg-link-hover disabled:opacity-70"
          >
            {busy ? "Signing up..." : "Sign up"}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-sm text-danger">{error}</p>}
      </div>
      <div className="border-separator py-5 text-center sm:border">
        Have an account?{" "}
        <Link href="/accounts/login" className="font-semibold text-link">
          Log in
        </Link>
      </div>
    </div>
  );
}
