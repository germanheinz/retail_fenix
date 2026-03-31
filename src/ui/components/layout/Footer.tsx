import Link from 'next/link'

export function Footer() {
  return (
    <footer className="flex w-full justify-center items-center gap-6 text-xs text-gray-500 py-8 border-t border-gray-100 mt-10">
      <Link href="/" className="font-bold text-gray-900">
        Fenix <span className="font-normal text-gray-500">| shop {new Date().getFullYear()}</span>
      </Link>
      <Link href="/topology" className="hover:text-gray-900 transition-colors">Topology</Link>
      <Link href="/info" className="hover:text-gray-900 transition-colors">Info</Link>
    </footer>
  )
}
