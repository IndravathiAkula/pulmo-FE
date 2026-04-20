import { books, Book } from '@/app/data/books';

/**
 * Shared data utilities for deriving doctors, departments, and trending books from the static dataset.
 * Centralizing this logic ensures consistency across the homepage and dedicated listing pages.
 */

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  bookCount: number;
  rating: number;
}

export interface Department {
  id: string;
  name: string;
  bookCount: number;
}

/**
 * Extract unique doctors from the books dataset.
 */
export const getDoctors = (limit?: number): Doctor[] => {
  const doctorNames = Array.from(new Set(books.map(b => b.author)));
  
  const doctors = doctorNames.map((name, i) => {
    const doctorBooks = books.filter(b => b.author === name);
    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name,
      specialization: doctorBooks[0]?.category || 'Specialist',
      bookCount: doctorBooks.length,
      rating: +(4.5 + (Math.sin(i) * 0.4)).toFixed(1), // Deterministic stable rating
    };
  });

  // Sort alphabetically by name
  const sortedDoctors = doctors.sort((a, b) => a.name.localeCompare(b.name));

  return limit ? sortedDoctors.slice(0, limit) : sortedDoctors;
};

/**
 * Extract unique clinical departments from the books dataset.
 */
export const getDepartments = (limit?: number): Department[] => {
  const categories = Array.from(new Set(books.map(b => b.category)));
  
  const departments = categories.map((cat) => ({
    id: cat.toLowerCase().replace(/\s+/g, '-'),
    name: cat,
    bookCount: books.filter(b => b.category === cat).length,
  }));

  // Sort by book count (popularity)
  const sortedDepts = departments.sort((a, b) => b.bookCount - a.bookCount);

  return limit ? sortedDepts.slice(0, limit) : sortedDepts;
};

/**
 * Return a curated subset of trending/featured books.
 */
export const getTrendingBooks = (limit?: number): Book[] => {
  // Sorting by rating and then review count to simulate "Trending"
  const trending = [...books].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.reviewCount - a.reviewCount;
  });

  return limit ? trending.slice(0, limit) : trending;
};
