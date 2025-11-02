import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Loader, Code } from 'lucide-react';
import { detectQuery } from '../services/api';

const EXAMPLE_QUERIES = {
  benign: [
    "SELECT * FROM users WHERE id = 1",
    "SELECT name, email FROM customers WHERE active = true",
    "UPDATE users SET last_login = NOW() WHERE id = 10",
  ],
  malicious: [
    "' UNION SELECT username, password FROM users--",
    "' AND 1=1--",
    "'; DROP TABLE users--",
    "' OR '1'='1",
    "' AND SLEEP(5)--",
  ],
};

const QueryTester = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDetect = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await detectQuery(query);
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = (exampleQuery) => {
    setQuery(exampleQuery);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-slide-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Query Tester</h2>
            <p className="text-primary-100">Test SQL queries for injection vulnerabilities</p>
          </div>
        </div>
      </div>

      {/* Query Input */}
      <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
        <label className="block text-sm font-medium mb-2">SQL Query</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter SQL query to test..."
          className="w-full h-32 px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
          disabled={loading}
        />
        
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDetect}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Detect Injection
              </>
            )}
          </button>
          
          <button
            onClick={() => {
              setQuery('');
              setResult(null);
              setError(null);
            }}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-danger-900/20 border border-danger-500 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5" />
            <p className="text-danger-200">{error}</p>
          </div>
        )}
      </div>

      {/* Example Queries */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Benign Examples
          </h3>
          <div className="space-y-2">
            {EXAMPLE_QUERIES.benign.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => loadExample(ex)}
                className="w-full text-left px-4 py-2 bg-slate-900 hover:bg-slate-700 rounded border border-slate-600 text-sm font-mono transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger-400" />
            Malicious Examples
          </h3>
          <div className="space-y-2">
            {EXAMPLE_QUERIES.malicious.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => loadExample(ex)}
                className="w-full text-left px-4 py-2 bg-slate-900 hover:bg-slate-700 rounded border border-slate-600 text-sm font-mono transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 animate-slide-in">
          <h3 className="text-xl font-semibold mb-4">Detection Results</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Status */}
            <div className={`p-6 rounded-lg border-2 ${
              result.is_malicious 
                ? 'bg-danger-900/20 border-danger-500' 
                : 'bg-green-900/20 border-green-500'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {result.is_malicious ? (
                  <AlertTriangle className="w-8 h-8 text-danger-400" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-400" />
                )}
                <div>
                  <div className="text-2xl font-bold">
                    {result.is_malicious ? 'MALICIOUS' : 'BENIGN'}
                  </div>
                  <div className="text-sm opacity-80">
                    {result.is_malicious ? 'SQL Injection Detected' : 'Query is Safe'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-sm opacity-80">Confidence:</span>
                  <span className="font-semibold">{(result.confidence * 100).toFixed(2)}%</span>
                </div>
                {result.attack_type && (
                  <div className="flex justify-between">
                    <span className="text-sm opacity-80">Attack Type:</span>
                    <span className="font-semibold">{result.attack_type.replace('_', ' ').toUpperCase()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm opacity-80">Response Time:</span>
                  <span className="font-semibold">{result.response_time_ms.toFixed(2)}ms</span>
                </div>
              </div>
            </div>

            {/* Query Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Original Query
                </label>
                <div className="p-3 bg-slate-900 rounded border border-slate-600 font-mono text-sm break-all">
                  {result.original_query}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Normalized Query
                </label>
                <div className="p-3 bg-slate-900 rounded border border-slate-600 font-mono text-sm break-all">
                  {result.normalized_query}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryTester;

