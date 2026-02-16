import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Clock, Search, ArrowLeft, ChevronDown, PlusCircle, MinusCircle } from 'lucide-react';
import { ProperlyLoader } from '@/components/properly-loader';
import type { PlaybookArticle } from '@shared/schema';

export default function PlaybookPage() {
  const [selectedArticle, setSelectedArticle] = useState<PlaybookArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  const { data: articles, isLoading } = useQuery<PlaybookArticle[]>({
    queryKey: ['/api/playbook'],
    queryFn: async () => {
      const res = await fetch('/api/playbook');
      if (!res.ok) throw new Error('Failed to load articles');
      return res.json();
    },
  });

  const filteredArticles = articles?.filter(a =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (firstLoad && filteredArticles && filteredArticles.length > 0 && expandedId === null) {
    setExpandedId(filteredArticles[0].id);
    setFirstLoad(false);
  }

  const visibleArticles = filteredArticles?.slice(0, visibleCount);
  const hasMore = filteredArticles && filteredArticles.length > visibleCount;

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (selectedArticle) {
    return (
      <Layout role="CLIENT">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setSelectedArticle(null)}
            className="mb-6"
            data-testid="button-back-to-playbook"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to The Playbook
          </Button>

          <article className="prose prose-gray max-w-none">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{selectedArticle.category}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {selectedArticle.readTimeMinutes} min read
              </span>
            </div>
            <h1 className="text-3xl font-heading font-bold mb-4" data-testid="article-title">
              {selectedArticle.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">{selectedArticle.summary}</p>
            <div className="space-y-4" data-testid="article-content">
              {selectedArticle.content.split('\n\n').map((paragraph, i) => {
                if (paragraph.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-heading font-bold mt-8 mb-3">{paragraph.slice(3)}</h2>;
                }
                if (paragraph.startsWith('### ')) {
                  return <h3 key={i} className="text-lg font-heading font-semibold mt-6 mb-2">{paragraph.slice(4)}</h3>;
                }
                if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
                  const items = paragraph.split('\n');
                  return (
                    <ul key={i} className="list-disc list-inside space-y-1 text-foreground/80">
                      {items.map((item, j) => (
                        <li key={j} dangerouslySetInnerHTML={{ __html: item.replace(/^[-\d.]\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      ))}
                    </ul>
                  );
                }
                return <p key={i} className="text-foreground/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
              })}
            </div>
          </article>
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="CLIENT">
      <div className="space-y-6">
        <div className="text-center relative">
          <h1 className="text-[30px] leading-[38px] font-semibold font-heading" data-testid="playbook-heading">
            Properly Playbook
          </h1>
          <p className="text-muted-foreground mt-2">
            Your go-to guide for buying and selling property in Australia.
          </p>
          <div className="absolute right-0 top-1 hidden sm:block">
            <Badge className="bg-[#17b26a] hover:bg-[#17b26a] text-white rounded-full px-3 py-1 text-xs font-medium">
              Buyer
            </Badge>
          </div>
        </div>

        <div className="bg-[#e7f6f3]/40 border border-[#c8e0db] rounded-xl p-6">
          <div className="flex justify-end mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-9 pr-14 bg-white"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-testid="input-search-playbook"
              />
              <div className="absolute right-2 top-1.5">
                <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <ProperlyLoader size="md" />
            </div>
          ) : filteredArticles?.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-bold text-lg">No articles found</h3>
              <p className="text-muted-foreground">Try adjusting your search.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#c8e0db]">
              {visibleArticles?.map(article => (
                <div
                  key={article.id}
                  className="py-4 first:pt-0 last:pb-0"
                  data-testid={`article-card-${article.slug}`}
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleExpand(article.id)}
                    data-testid={`accordion-toggle-${article.slug}`}
                  >
                    <h3 className="text-[16px] font-semibold text-[#181d27] font-heading">
                      {article.title}
                    </h3>
                    <button className="shrink-0 ml-4 mt-0.5 text-[#535862]">
                      {expandedId === article.id ? (
                        <MinusCircle className="h-5 w-5" />
                      ) : (
                        <PlusCircle className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {expandedId === article.id && (
                    <div className="mt-2">
                      <p className="text-[14px] text-[#535862] leading-relaxed">
                        {article.summary}
                      </p>
                      <button
                        className="mt-2 text-[14px] text-[#181d27] underline underline-offset-2 hover:text-primary"
                        onClick={() => setSelectedArticle(article)}
                        data-testid={`link-read-more-${article.slug}`}
                      >
                        Find out more here
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setVisibleCount(prev => prev + 6)}
                data-testid="button-load-more"
              >
                Load more
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
