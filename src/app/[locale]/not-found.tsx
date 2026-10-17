import Link from "next/link";

export default function NotFound() {
  return <div className="empty"><h1>404</h1><p>Page introuvable / الصفحة غير متاحة</p><Link href="/ar">Geniura</Link></div>;
}
