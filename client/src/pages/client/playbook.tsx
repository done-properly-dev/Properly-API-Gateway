import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Clock, Search, ArrowLeft, ChevronRight } from 'lucide-react';
import type { PlaybookArticle } from '@shared/schema';

const CATEGORIES = [
  { value: '', label: 'All Articles' },
  { value: 'Getting Started', label: 'Getting Started' },
  { value: 'The Process', label: 'The Process' },
  { value: 'Money Matters', label: 'Money Matters' },
];

export default function PlaybookPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<PlaybookArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: articles, isLoading } = useQuery<PlaybookArticle[]>({
    queryKey: ['/api/playbook', selectedCategory ? `?category=${selectedCategory}` : ''],
    queryFn: async () => {
      const url = selectedCategory
        ? `/api/playbook?category=${encodeURIComponent(selectedCategory)}`
        : '/api/playbook';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load articles');
      return res.json();
    },
  });

  const filteredArticles = articles?.filter(a =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div>
          <h1 className="text-3xl font-heading font-bold" data-testid="playbook-heading">The Playbook</h1>
          <p className="text-muted-foreground mt-2">
            Your go-to guide for understanding the property settlement process. No jargon, just straight-up helpful info.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              data-testid="input-search-playbook"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
                className={selectedCategory === cat.value ? 'bg-primary' : ''}
                data-testid={`filter-${cat.value || 'all'}`}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredArticles?.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-bold text-lg">No articles found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredArticles?.map(article => (
              <Card
                key={article.id}
                className="border hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedArticle(article)}
                data-testid={`article-card-${article.slug}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {article.readTimeMinutes} min
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-4 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
