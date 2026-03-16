"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Input, Button } from "@/components/ui";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password)
      return toast.error("Please fill all fields");
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    try {
      setLoading(true);
      await register(form.name, form.email, form.password);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-8 animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-1">
          <span className="text-brand">Sahil</span>
          <span className="text-slate-100">OS</span>
        </h1>
        <p className="text-slate-500 text-sm">Create your personal operating system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={form.name}
          onChange={set("name")}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 6 characters"
          value={form.password}
          onChange={set("password")}
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
          {loading ? "Creating account…" : "Get Started"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:text-brand-light transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
