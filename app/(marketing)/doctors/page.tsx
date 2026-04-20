import { redirect } from 'next/navigation';

export const metadata = {
  title: 'About the Author | PulmoPrep',
  description: 'Meet the specialist author behind PulmoPrep study materials.',
};

/**
 * With the single-doctor simplification,
 * /doctors now redirects to the single author's profile.
 * The route is kept alive so existing links/bookmarks don't break.
 */
export default function DoctorsPage() {
  redirect('/doctors/dr.-rohan');
}
