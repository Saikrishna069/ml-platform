import pandas as pd
import numpy as np
from typing import List, Dict, Tuple, Any
import logging
import re
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from collections import Counter

logger = logging.getLogger(__name__)

# Standard english stop words list
STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
    'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
    'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t',
    'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
    'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
    'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
    'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i',
    'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it',
    'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my',
    'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
    'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t',
    'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some',
    'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
    'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
    'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
    'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were',
    'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which',
    'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would',
    'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
    'yourself', 'yourselves'
}

# Positive and negative lexicons for rule-based sentiment fallback
POSITIVE_LEXICON = {'good', 'great', 'excellent', 'amazing', 'awesome', 'best', 'love', 'fantastic', 'wonderful', 'happy', 'positive', 'super', 'effective', 'perfect'}
NEGATIVE_LEXICON = {'bad', 'terrible', 'worst', 'horrible', 'hate', 'awful', 'poor', 'negative', 'useless', 'slow', 'fail', 'broken', 'defect', 'issue'}

class TextPreprocessor:
    """Preprocess text data"""
    
    def __init__(self):
        self.stop_words = STOP_WORDS
    
    def clean_text(self, text: str) -> str:
        """Clean text"""
        if not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r'http\S+|www\S+', '', text)
        text = re.sub(r'\S+@\S+', '', text)
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def tokenize(self, text: str) -> List[str]:
        """Tokenize text"""
        cleaned = self.clean_text(text)
        tokens = cleaned.split()
        return [t for t in tokens if t not in self.stop_words and len(t) > 2]

class SentimentAnalyzer:
    """Analyze sentiment of text"""
    
    def __init__(self):
        try:
            from nltk.sentiment import SentimentIntensityAnalyzer
            self.vader = SentimentIntensityAnalyzer()
        except Exception:
            self.vader = None
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment"""
        if not isinstance(text, str) or not text.strip():
            return {"compound": 0.0, "positive": 0.0, "negative": 0.0, "neutral": 1.0, "sentiment": "neutral"}
        
        if self.vader:
            scores = self.vader.polarity_scores(text)
            compound = float(scores['compound'])
            return {
                "compound": compound,
                "positive": float(scores['pos']),
                "negative": float(scores['neg']),
                "neutral": float(scores['neu']),
                "sentiment": self._label_sentiment(compound)
            }
        else:
            words = set(re.findall(r'\w+', text.lower()))
            pos_hits = len(words.intersection(POSITIVE_LEXICON))
            neg_hits = len(words.intersection(NEGATIVE_LEXICON))
            
            total = pos_hits + neg_hits
            if total == 0:
                compound = 0.0
            else:
                compound = (pos_hits - neg_hits) / total
            
            return {
                "compound": compound,
                "positive": pos_hits / max(len(words), 1),
                "negative": neg_hits / max(len(words), 1),
                "neutral": 1.0 - (pos_hits + neg_hits) / max(len(words), 1),
                "sentiment": self._label_sentiment(compound)
            }
    
    def _label_sentiment(self, compound: float) -> str:
        if compound >= 0.05:
            return "positive"
        elif compound <= -0.05:
            return "negative"
        else:
            return "neutral"
    
    def batch_analyze(self, texts: List[str]) -> List[Dict[str, Any]]:
        results = []
        for text in texts:
            sentiment = self.analyze(str(text))
            results.append({"text": str(text), **sentiment})
        return results

class TopicModeler:
    """Extract topics from text documents"""
    
    def __init__(self, n_topics: int = 5):
        self.n_topics = n_topics
        self.vectorizer = None
        self.lda_model = None
    
    def fit(self, texts: List[str]) -> bool:
        try:
            clean_texts = [TextPreprocessor().clean_text(str(t)) for t in texts if str(t).strip()]
            if not clean_texts:
                return False
                
            self.vectorizer = CountVectorizer(max_features=1000, stop_words='english')
            doc_term_matrix = self.vectorizer.fit_transform(clean_texts)
            
            self.lda_model = LatentDirichletAllocation(
                n_components=min(self.n_topics, doc_term_matrix.shape[1]),
                random_state=42,
                max_iter=10
            )
            self.lda_model.fit(doc_term_matrix)
            return True
        except Exception as e:
            logger.error(f"Topic modeling fit failed: {str(e)}")
            return False
    
    def get_topics(self, n_words: int = 10) -> Dict[int, List[str]]:
        if self.lda_model is None:
            return {}
        
        topics = {}
        feature_names = self.vectorizer.get_feature_names_out()
        
        for topic_idx, topic in enumerate(self.lda_model.components_):
            top_indices = topic.argsort()[-n_words:][::-1]
            top_words = [feature_names[i] for i in top_indices]
            topics[topic_idx] = top_words
        
        return topics
    
    def predict_topics(self, texts: List[str]) -> List[Dict[int, float]]:
        if self.vectorizer is None or self.lda_model is None:
            return []
        
        try:
            clean_texts = [TextPreprocessor().clean_text(str(t)) for t in texts]
            doc_term_matrix = self.vectorizer.transform(clean_texts)
            topic_distributions = self.lda_model.transform(doc_term_matrix)
            
            results = []
            for dist in topic_distributions:
                topic_dict = {int(i): float(prob) for i, prob in enumerate(dist)}
                results.append(topic_dict)
            
            return results
        except Exception as e:
            logger.error(f"Topic prediction failed: {str(e)}")
            return []

class KeywordExtractor:
    """Extract keywords from text"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
    
    def extract_keywords(self, text: str, n_keywords: int = 10) -> List[Tuple[str, float]]:
        try:
            clean_text = TextPreprocessor().clean_text(str(text))
            if not clean_text:
                return []
            tfidf_matrix = self.vectorizer.fit_transform([clean_text])
            feature_names = self.vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
            
            top_indices = np.argsort(scores)[-n_keywords:][::-1]
            keywords = [(feature_names[i], float(scores[i])) for i in top_indices if scores[i] > 0]
            return keywords
        except Exception as e:
            logger.error(f"Keyword extraction failed: {str(e)}")
            return []
    
    def extract_keywords_batch(self, texts: List[str], n_keywords: int = 10) -> List[List[Tuple[str, float]]]:
        return [self.extract_keywords(text, n_keywords) for text in texts]

class TextSummarizer:
    """Summarize text documents"""
    
    @staticmethod
    def extractive_summary(text: str, num_sentences: int = 3) -> str:
        try:
            sentences = [s.strip() for s in re.split(r'[.!?]+', str(text)) if s.strip()]
            if len(sentences) <= num_sentences:
                return str(text)
            
            vectorizer = TfidfVectorizer(stop_words='english')
            sentence_matrix = vectorizer.fit_transform(sentences)
            
            scores = sentence_matrix.sum(axis=1).A1
            top_indices = np.argsort(scores)[-num_sentences:]
            top_indices = np.sort(top_indices)
            
            summary = '. '.join([sentences[i] for i in top_indices]) + '.'
            return summary
        except Exception as e:
            logger.error(f"Summarization failed: {str(e)}")
            return str(text)

class TextStatistics:
    """Calculate text statistics"""
    
    @staticmethod
    def get_statistics(texts: List[str]) -> Dict[str, Any]:
        preprocessor = TextPreprocessor()
        token_counts = []
        sentence_counts = []
        word_lengths = []
        
        for text in texts:
            t_str = str(text)
            tokens = preprocessor.tokenize(t_str)
            sentences = [s for s in re.split(r'[.!?]+', t_str) if s.strip()]
            
            token_counts.append(len(tokens))
            sentence_counts.append(len(sentences))
            word_lengths.extend([len(w) for w in tokens])
        
        all_tokens = [w for t in texts for w in preprocessor.tokenize(str(t))]
        
        return {
            "total_documents": len(texts),
            "avg_tokens_per_doc": float(np.mean(token_counts)) if token_counts else 0,
            "avg_sentences_per_doc": float(np.mean(sentence_counts)) if sentence_counts else 0,
            "avg_word_length": float(np.mean(word_lengths)) if word_lengths else 0,
            "vocabulary_size": len(set(all_tokens)),
            "total_words": len(all_tokens)
        }
