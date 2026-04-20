/**
 * Reader Layout – Empty to ensure the reader is truly fullscreen without NavigationBar.
 */
export default function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
