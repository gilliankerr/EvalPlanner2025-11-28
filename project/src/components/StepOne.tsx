import React, { useState, useRef } from 'react';
import { AlertCircle, FileText, Clock, Lock, MapPin, BarChart3, ClipboardList, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import type { ProgramData } from '../App';
import styles from './StepOne.module.css';

interface StepOneProps {
  programData: ProgramData;
  updateProgramData: (data: Partial<ProgramData>) => void;
  onComplete: () => void;
  setIsProcessing: (processing: boolean) => void;
  onShowExampleReport: () => void;
  onShowAboutFramework: () => void;
}

const StepOne: React.FC<StepOneProps> = ({ programData, updateProgramData, onComplete, setIsProcessing, onShowExampleReport, onShowAboutFramework }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const extractUrlsFromText = (text: string): string[] => {
    if (!text) return [];

    // Regex to match URLs (http, https, www)
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    const matches = text.match(urlRegex) || [];

    return matches.map(url => {
      // Add https:// to www URLs
      if (url.startsWith('www.')) {
        return 'https://' + url;
      }
      return url;
    }).filter(url => {
      // Basic validation - must have a domain
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!programData.organizationName.trim()) {
      newErrors.organizationName = 'Organization name is required';
    }

    if (!programData.programName.trim()) {
      newErrors.programName = 'Program name is required';
    }

    if (!programData.aboutProgram.trim()) {
      newErrors.aboutProgram = 'Program description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const extractedUrls = extractUrlsFromText(programData.aboutProgram);
    updateProgramData({ urls: extractedUrls });

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onComplete();
    }, 1000);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Create a detailed evaluation plan in minutes</h1>
        <p className={styles.heroSubtitle}>
          Answer 3 simple questions. Get a comprehensive plan with logic model, indicators,
          data collection methods, and implementation timeline.
        </p>

        <div className={styles.heroCtas}>
          <button onClick={scrollToForm} className={styles.primaryCta}>
            Get Started
            <ArrowRight size={18} />
          </button>
          <button onClick={onShowExampleReport} className={styles.secondaryCta}>
            <FileText size={18} />
            See Example Report
          </button>
        </div>

        <div className={styles.trustBadges}>
          <div className={styles.badge}>
            <Clock size={16} />
            <span>5-10 minutes</span>
          </div>
          <div className={styles.badge}>
            <Lock size={16} />
            <span>No login required</span>
          </div>
          <div className={styles.badge}>
            <MapPin size={16} />
            <span>Free for Canadian nonprofits</span>
          </div>
        </div>
      </div>

      {/* What You'll Get Section */}
      <div className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>What you'll get</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <BarChart3 size={24} />
            </div>
            <h3>Logic Model</h3>
            <p>Visual map showing how your program creates change from inputs to long-term outcomes</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <ClipboardList size={24} />
            </div>
            <h3>Evaluation Framework</h3>
            <p>Specific indicators, data sources, collection methods, and respondents for each measure</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Calendar size={24} />
            </div>
            <h3>Implementation Plan</h3>
            <p>Four-phase timeline with roles, responsibilities, and meeting agendas</p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className={styles.formContainer} ref={formRef}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>Provide information</h2>
          <p className={styles.formSubtitle}>Tell us about your program — don't worry, this doesn't need to be perfect</p>
        </div>

      <div className={styles.formFields}>
        {/* Organization Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.staticLabel}>
            Organization name<span className={styles.requiredStar}>*</span>
          </label>
          <input
            type="text"
            value={programData.organizationName}
            onChange={(e) => updateProgramData({ organizationName: e.target.value })}
            className={`${styles.input} ${errors.organizationName ? styles.inputError : ''}`}
            placeholder="Enter organization or partnership name"
          />
          <p className={styles.helperText}>
            The name of your organization or partnership
          </p>
          {errors.organizationName && (
            <p className={styles.errorMessage}>
              <AlertCircle className={styles.errorIcon} />
              {errors.organizationName}
            </p>
          )}
        </div>

        {/* Program Name */}
        <div className={styles.fieldGroup}>
          <label className={styles.staticLabel}>
            Program name<span className={styles.requiredStar}>*</span>
          </label>
          <input
            type="text"
            value={programData.programName}
            onChange={(e) => updateProgramData({ programName: e.target.value })}
            className={`${styles.input} ${errors.programName ? styles.inputError : ''}`}
            placeholder="Program name or 'All Programs'"
          />
          <p className={styles.helperText}>
            Enter the program name. To evaluate the entire organization, write 'All Programs'
          </p>
          {errors.programName && (
            <p className={styles.errorMessage}>
              <AlertCircle className={styles.errorIcon} />
              {errors.programName}
            </p>
          )}
        </div>

        {/* About the Program */}
        <div className={styles.fieldGroup}>
          <label className={styles.staticLabel}>
            About the program<span className={styles.requiredStar}>*</span>
          </label>
          <textarea
            value={programData.aboutProgram}
            onChange={(e) => updateProgramData({ aboutProgram: e.target.value })}
            className={`${styles.textarea} ${errors.aboutProgram ? styles.inputError : ''}`}
            placeholder="Enter URLs or paste program information here&#10;&#10;Example: https://example.org/about-program.html"
          />
          <p className={styles.helperText}>
            Include web page URLs describing the program and organization. You can also paste text from funding proposals, reports, or your own knowledge.
          </p>
          {errors.aboutProgram && (
            <p className={styles.errorMessage}>
              <AlertCircle className={styles.errorIcon} />
              {errors.aboutProgram}
            </p>
          )}
          {programData.aboutProgram && extractUrlsFromText(programData.aboutProgram).length > 0 && (
            <div className={styles.urlBox}>
              <p className={styles.urlTitle}>
                URLs detected ({extractUrlsFromText(programData.aboutProgram).length})
              </p>
              <ul className={styles.urlList}>
                {extractUrlsFromText(programData.aboutProgram).map((url, index) => (
                  <li key={index} className={styles.urlItem}>• {url}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className={styles.submitButton}
        >
          Submit
        </button>
      </div>
      </div>

      {/* About the Framework Section */}
      <div className={styles.frameworkSection}>
        <div className={styles.frameworkContent}>
          <BookOpen size={24} className={styles.frameworkIcon} />
          <div className={styles.frameworkText}>
            <h3>Powered by research</h3>
            <p>
              This tool is based on the LogicalOutcomes Evaluation Planning Handbook,
              a simplified evidence-based methodology developed over decades of working with nonprofit organizations.
            </p>
            <button onClick={onShowAboutFramework} className={styles.frameworkLink}>
              Learn about the framework <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepOne;
