/**
 * Centralized constants for the PulmoPrep single-doctor, single-department configuration.
 * Update these values in one place to reflect across the entire application.
 */

export const DEFAULT_DOCTOR = {
  name: 'Dr. Indravathi A',
  title: 'Pulmonologist & Author',
  specialization: 'Pulmonology',
  bio: 'Pulmonology Specialist with a strong focus on diagnosing  and managing respiratory conditions such as asthma, COPD, interstitial lung diseases, and sleep-related breathing disorders. Aim to provide patient-centered care using the latest evidence-based practices. Passionate about medical education and actively contribute to learning by simplifying complex pulmonary concepts for students and healthcare professionals. The approach is clear, practical and focused on building real-world clinical confidence.',
  location: 'Medical Center, India',
  email: 'isms24analytics@gmail.com',
};

export const DEFAULT_DEPARTMENT = 'Pulmonology';

export const PLATFORM = {
  name: 'PulmoPrep',
  tagline: 'Exit Exam Companion for MD, DNB and DM Pulmonary Medicine',
  subtitle: 'Master Pulmonology with clarity and confidence',
};

export const FEATURES = [
  {
    title: 'Exam-focused learning',
    description: 'Structured for MD, DNB and DM pulmonary medicine students.',
  },
  {
    title: 'Crisp notes',
    description: 'Digitally made from standard textbooks and guidelines.',
  },
  {
    title: 'Concept simplification',
    description: 'Covering high yield content from previous question papers.',
  },
  {
    title: 'Viva ready',
    description: 'Keeps you theory and practical viva ready.',
  },
];


export const SIGNATURE_SERVICES = [
  {
    title: 'New Questions',
    description: 'New theory questions are added',
    frequency: 'Every 15 days',
    icon: 'FileText' as const,
  },
  {
    title: '50 MCQ Quiz',
    description: 'Practice with curated MCQs',
    frequency: 'Every month',
    icon: 'ClipboardCheck' as const,
  },
  {
    title: 'WhatsApp Group',
    description: 'For doubts & active discussion',
    frequency: 'Always available',
    icon: 'MessageCircle' as const,
  },
];
