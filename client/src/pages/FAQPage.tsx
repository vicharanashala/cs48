import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { categoriesApi } from '../services/categories.service';
import { questionsApi } from '../services/questions.service';
import FAQAccordion from '../components/questions/FAQAccordion';
import { EmptyState } from '../components/common';

// Temporary inline skeleton for the stacked layout
const StackSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="animate-pulse bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6">
        <div className="h-6 bg-surface-container rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-surface-container rounded w-1/4"></div>
      </div>
    ))}
  </div>
);

const FAQPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch all categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
    staleTime: 30 * 60 * 1000,
  });

  const categories = categoriesData?.data ?? [];

  // Fetch questions for selected category or all FAQs
  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['faqs', selectedCategory],
    queryFn: () => {
      if (selectedCategory) {
        return questionsApi.getAll({ category: selectedCategory, tags: ['faq'], sort: 'recent' });
      } else {
        return questionsApi.getAll({ tags: ['faq'], sort: 'recent' });
      }
    },
  });

  const questions = questionsData?.data ?? [];

  return (
    <div className="page-container py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-headline-lg font-bold text-on-surface mb-2">Frequently Asked Questions</h1>
        <p className="text-body-md text-on-surface-variant">
          Find answers to common questions about Vicharanashala Internship.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Category Sidebar */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="sticky top-24">
            <h2 className="text-label-lg font-semibold text-on-surface mb-4">Categories</h2>
            {categories.length > 0 ? (
              <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium whitespace-nowrap text-left ${
                    selectedCategory === null
                      ? 'bg-primary-container text-on-primary-container shadow-sm'
                      : 'bg-transparent text-on-surface hover:bg-surface-container-low hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">apps</span>
                  <span>All FAQs</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium whitespace-nowrap text-left ${
                      selectedCategory === cat._id
                        ? 'bg-primary-container text-on-primary-container shadow-sm'
                        : 'bg-transparent text-on-surface hover:bg-surface-container-low hover:text-primary'
                    }`}
                  >
                    <span 
                      className="material-symbols-outlined text-[20px]"
                      style={{ color: selectedCategory !== cat._id ? cat.color : undefined }}
                    >
                      {cat.icon}
                    </span>
                    <span className="flex-grow">{cat.name}</span>
                  </button>
                ))}
              </nav>
            ) : (
              <div className="text-sm text-on-surface-variant">Loading categories...</div>
            )}
          </div>
        </aside>

        {/* Right Column: FAQ Accordion Feed */}
        <div className="flex-grow min-w-0">
          <h2 className="text-label-lg font-semibold text-on-surface mb-6">
            {selectedCategory
              ? categories.find((c) => c._id === selectedCategory)?.name
              : 'All FAQs'}
          </h2>

          {isLoading ? (
            <StackSkeleton count={5} />
          ) : questions.length === 0 ? (
            <EmptyState
              icon="help_outline"
              title="No FAQs found"
              description="No frequently asked questions available in this category."
            />
          ) : (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={selectedCategory}
            >
              {questions.map((q) => (
                <FAQAccordion key={q._id} question={q} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
