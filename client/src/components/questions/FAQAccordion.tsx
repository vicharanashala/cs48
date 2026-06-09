import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, MessageCircle, Share2 } from 'lucide-react';
import type { Question } from '../../types';
import VoteButtons from '../votes/VoteButtons';
import toast from 'react-hot-toast';

interface FAQAccordionProps {
  question: Question;
  isInitiallyExpanded?: boolean;
}

const FAQAccordion = ({ question, isInitiallyExpanded = false }: FAQAccordionProps) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/questions/${question._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return (
    <motion.div
      layout
      className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden hover:border-outline-variant/60 transition-colors duration-300"
      style={{
        boxShadow: isExpanded 
          ? '0 10px 15px -3px rgba(0,0,0,0.1), 0 20px 40px -10px rgba(0,0,0,0.18)' 
          : '0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 40px -10px rgba(0,0,0,0.12)',
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between p-6 text-left focus:outline-none"
        aria-expanded={isExpanded}
      >
        <h3 className={`font-semibold pr-8 transition-colors duration-200 ${isExpanded ? 'text-primary' : 'text-on-surface hover:text-primary'} text-body-lg md:text-title-md`}>
          {question.title}
        </h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 mt-1 text-on-surface-variant"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-6 pt-0">
              <div className="prose prose-sm md:prose-base max-w-none text-on-surface leading-relaxed mb-6 border-t border-outline-variant/20 pt-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {question.description || '*No answer provided yet.*'}
                </ReactMarkdown>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                <div onClick={(e) => e.stopPropagation()}>
                  <VoteButtons
                    targetId={question._id}
                    targetType="question"
                    upvotes={question.upvotes}
                    downvotes={question.downvotes}
                    voteScore={question.voteScore}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-container-high"
                    title="Copy link to this FAQ"
                  >
                    <Share2 size={16} />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  <Link
                    to={`/questions/${question._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-sm font-semibold text-primary bg-primary-container/20 hover:bg-primary-container/40 px-4 py-1.5 rounded-lg transition-colors"
                  >
                    <MessageCircle size={16} />
                    Discuss
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQAccordion;
