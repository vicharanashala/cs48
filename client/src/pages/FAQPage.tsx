import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { categoriesApi } from '../services/categories.service';
import { questionsApi } from '../services/questions.service';
import QuestionCard from '../components/questions/QuestionCard';
import { QuestionsGridSkeleton, EmptyState } from '../components/common';

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
    queryKey: ['faq-questions', selectedCategory],
    queryFn: () => {
      if (selectedCategory) {
        return questionsApi.getAll({ category: selectedCategory, tags: 'faq', sort: 'recent' });
      } else {
        return questionsApi.getAll({ tags: 'faq', sort: 'recent' });
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

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-10">
          <h2 className="text-label-lg font-semibold text-on-surface mb-4">Filter by Category</h2>
          <motion.div
            className="flex flex-wrap gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm ${
                selectedCategory === null
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              All FAQs
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm flex items-center gap-2 ${
                  selectedCategory === cat._id
                    ? 'text-on-primary'
                    : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                }`}
                style={{
                  backgroundColor: selectedCategory === cat._id ? cat.color : undefined,
                }}
              >
                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                <span className="hidden sm:inline">{cat.name}</span>
              </button>
            ))}
          </motion.div>
        </div>
      )}

      {/* Questions Grid */}
      <div>
        <h2 className="text-label-lg font-semibold text-on-surface mb-6">
          {selectedCategory
            ? categories.find((c) => c._id === selectedCategory)?.name
            : 'All FAQs'}
        </h2>

        {isLoading ? (
          <QuestionsGridSkeleton count={6} />
        ) : questions.length === 0 ? (
          <EmptyState
            icon="help_outline"
            title="No FAQs found"
            description="No frequently asked questions available in this category."
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={selectedCategory}
          >
            {questions.map((q) => (
              <QuestionCard key={q._id} question={q} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FAQPage;
