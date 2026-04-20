import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Study Materials | PulmoPrep',
  description: 'Explore Pulmonary Medicine study materials for MD, DNB and DM exam preparation.',
};

/**
 * With the single-department (Pulmonology) simplification,
 * /departments now redirects to the full catalog.
 * The route is kept alive so existing links/bookmarks don't break.
 */
export default function DepartmentsPage() {
  redirect('/departments/all-departments');
}
