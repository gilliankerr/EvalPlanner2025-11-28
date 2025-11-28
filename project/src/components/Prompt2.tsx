import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import type { ProgramData } from '../App';
import { fetchPrompt, buildPromptWithContext } from '../utils/promptApi';
import styles from './Prompt.module.css';

interface Prompt2Props {
  programData: ProgramData;
  updateProgramData: (data: Partial<ProgramData>) => void;
  onComplete: () => void;
  setIsProcessing: (processing: boolean) => void;
}

const Prompt2: React.FC<Prompt2Props> = ({ programData, updateProgramData, onComplete, setIsProcessing }) => {
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [jobId, setJobId] = useState<number | null>(null);
  const isJobSubmitted = useRef(false);

  useEffect(() => {
    // Prevent duplicate job submission in React StrictMode
    if (!isJobSubmitted.current) {
      isJobSubmitted.current = true;
      analyzeProgram();
    }
  }, []);

  const analyzeProgram = async () => {
    setIsProcessing(true);
    setAnalysisStatus('analyzing');

    try {
      const adminTemplate = await fetchPrompt('prompt2');

      const analysisPrompt = buildPromptWithContext(adminTemplate, {
        organizationName: programData.organizationName,
        programName: programData.programName,
        aboutProgram: programData.aboutProgram,
        scrapedContent: programData.scrapedContent,
        labeledScrapedContent: programData.labeledScrapedContent,
        programAnalysis: programData.programAnalysis
      });

      const jobData = {
        job_type: 'prompt2',
        input_data: {
          messages: [
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          max_tokens: 4000,
          metadata: {
            organizationName: programData.organizationName,
            programName: programData.programName
          }
        }
      };

      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        throw new Error(`Job creation failed: ${response.status}`);
      }

      const data = await response.json();
      const createdJobId = data.job_id;
      setJobId(createdJobId);

      console.log(`Job ${createdJobId} created, polling for results...`);

      pollJobStatus(createdJobId);

    } catch (error) {
      console.error('Error creating job:', error);
      setAnalysisStatus('error');
      setIsProcessing(false);
    }
  };

  const pollJobStatus = async (jobId: number) => {
    const maxAttempts = 200;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);

        if (!response.ok) {
          throw new Error(`Job status check failed: ${response.status}`);
        }

        const job = await response.json();

        if (job.status === 'completed') {
          const framework = job.result;

          setAnalysisResult(framework);
          updateProgramData({ evaluationFramework: framework });
          setAnalysisStatus('complete');

          setTimeout(() => {
            setIsProcessing(false);
            onComplete();
          }, 2000);

        } else if (job.status === 'failed') {
          throw new Error(job.error || 'Job processing failed');
        } else if (job.status === 'pending' || job.status === 'processing') {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000);
          } else {
            throw new Error('Job timeout - processing took too long');
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        setAnalysisStatus('error');
        setIsProcessing(false);
      }
    };

    poll();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.iconWrapper}>
            <Sparkles className={styles.icon} />
          </div>
          <div>
            <h2 className={styles.title}>AI Evaluation Framework</h2>
            <p className={styles.subtitle}>Building evaluation framework using advanced AI</p>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={`${styles.statusCard} ${styles[analysisStatus]}`}>
          <div className={styles.statusContent}>
            {analysisStatus === 'analyzing' && <Loader2 className={`${styles.statusIcon} ${styles.analyzing}`} style={{ animation: 'spin 1s linear infinite' }} />}
            {analysisStatus === 'complete' && <CheckCircle className={`${styles.statusIcon} ${styles.complete}`} />}
            {analysisStatus === 'error' && (
              <svg className={`${styles.statusIcon} ${styles.error}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}

            <div>
              <h3 className={styles.statusTitle}>
                {analysisStatus === 'analyzing' && 'Building Evaluation Framework...'}
                {analysisStatus === 'complete' && 'Framework Complete'}
                {analysisStatus === 'error' && 'Framework Generation Failed'}
                {analysisStatus === 'idle' && 'Preparing Framework Generation...'}
              </h3>
              <p className={styles.statusDescription}>
                {analysisStatus === 'analyzing' && (
                  <>
                    Processing... Please keep this window open until complete.
                    {jobId && <span style={{ display: 'block', marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>Job ID: {jobId}</span>}
                  </>
                )}
                {analysisStatus === 'complete' && 'Evaluation framework generated successfully'}
                {analysisStatus === 'error' && 'An error occurred during framework generation'}
                {analysisStatus === 'idle' && 'Setting up framework generation parameters'}
              </p>
            </div>
          </div>
        </div>

        {analysisStatus === 'error' && (
          <div className={styles.errorSection}>
            <div className={styles.errorBox}>
              <p className={styles.errorMessage}>
                The evaluation framework generation encountered an issue. This could be due to API connectivity or rate limits. You can:
              </p>
              <div className={styles.buttonGroup}>
                <button
                  onClick={analyzeProgram}
                  className={styles.primaryButton}
                >
                  Retry Generation
                </button>
                <button
                  onClick={() => {
                    updateProgramData({
                      evaluationFramework: 'Framework generation skipped by user due to error'
                    });
                    setIsProcessing(false);
                    onComplete();
                  }}
                  className={styles.secondaryButton}
                >
                  Skip and Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {analysisStatus === 'analyzing' && (
          <div className={styles.progressList}>
            <div className={styles.progressItem}>
              <div className={styles.progressDot}></div>
              <span className={styles.progressText}>Developing evaluation questions</span>
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressDot} style={{ animationDelay: '0.5s' }}></div>
              <span className={styles.progressText}>Defining key performance indicators</span>
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressDot} style={{ animationDelay: '1s' }}></div>
              <span className={styles.progressText}>Designing data collection methods</span>
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressDot} style={{ animationDelay: '1.5s' }}></div>
              <span className={styles.progressText}>Creating evaluation timeline</span>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className={styles.resultsSection}>
            <h4 className={styles.resultsTitle}>Framework Results</h4>
            <div className={styles.resultsBox}>
              <pre className={styles.resultsContent}>
                {analysisResult}
              </pre>
            </div>
          </div>
        )}

        <div className={styles.detailsBox}>
          <h4 className={styles.detailsTitle}>Framework Details</h4>
          <div className={styles.detailsList}>
            <div>• Focus: {programData.programName}</div>
            <div>• Organization: {programData.organizationName}</div>
            <div>• Data Sources: Program analysis, description, URLs</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Prompt2;
