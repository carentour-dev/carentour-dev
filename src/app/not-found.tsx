"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname() ?? "/";
  const isArabic = pathname === "/ar" || pathname.startsWith("/ar/");
  const homeHref = isArabic ? "/ar" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">
          {isArabic ? "عذرًا، الصفحة غير موجودة" : "Oops! Page not found"}
        </p>
        <Link
          href={homeHref}
          className="text-blue-500 hover:text-blue-700 underline"
        >
          {isArabic ? "العودة إلى الصفحة الرئيسية" : "Return to Home"}
        </Link>
      </div>
    </div>
  );
}
