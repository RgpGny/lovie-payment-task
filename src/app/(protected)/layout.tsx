import { Header } from "@/components/header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>
      </main>
    </>
  );
}
