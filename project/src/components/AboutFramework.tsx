import React from 'react';
import { X, ArrowRight, CheckCircle2, Target, Users, BarChart3, FileCheck, BookOpen, Lightbulb } from 'lucide-react';
import styles from './AboutFramework.module.css';

interface AboutFrameworkProps {
  onClose: () => void;
}

const AboutFramework: React.FC<AboutFrameworkProps> = ({ onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>About the Framework</h2>
            <p className={styles.subtitle}>The methodology behind your evaluation plan</p>
          </div>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Introduction */}
          <section className={styles.introSection}>
            <div className={styles.introIcon}>
              <BookOpen size={32} />
            </div>
            <div className={styles.introText}>
              <h3>LogicalOutcomes Evaluation Planning Handbook</h3>
              <p>
                This tool is powered by the LogicalOutcomes Evaluation Planning Handbook,
                a simplified evidence-based methodology developed over decades of working with
                nonprofit organizations. Created by Dr. Gillian Kerr and Sophie Llewelyn,
                it provides a practical, utilization-focused approach to program evaluation.
              </p>
              <a
                href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4815131"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.paperLink}
              >
                Read the full handbook on SSRN <ArrowRight size={16} />
              </a>
            </div>
          </section>

          {/* Logic Model Infographic */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <BarChart3 size={20} />
              The Logic Model: How Programs Create Change
            </h3>
            <p className={styles.sectionDesc}>
              Every program follows a logical chain from resources to impact. Understanding this chain
              helps identify what to measure and how to improve.
            </p>
            <div className={styles.logicModelFlow}>
              <div className={styles.logicModelStep}>
                <div className={styles.stepIcon} style={{ background: '#dbeafe' }}>
                  <span style={{ color: '#1d4ed8' }}>1</span>
                </div>
                <div className={styles.stepLabel}>Inputs</div>
                <div className={styles.stepDesc}>Staff, funding, facilities, partnerships</div>
              </div>
              <div className={styles.flowArrow}><ArrowRight size={20} /></div>
              <div className={styles.logicModelStep}>
                <div className={styles.stepIcon} style={{ background: '#dcfce7' }}>
                  <span style={{ color: '#16a34a' }}>2</span>
                </div>
                <div className={styles.stepLabel}>Activities</div>
                <div className={styles.stepDesc}>Services delivered, workshops, support</div>
              </div>
              <div className={styles.flowArrow}><ArrowRight size={20} /></div>
              <div className={styles.logicModelStep}>
                <div className={styles.stepIcon} style={{ background: '#fef3c7' }}>
                  <span style={{ color: '#d97706' }}>3</span>
                </div>
                <div className={styles.stepLabel}>Outputs</div>
                <div className={styles.stepDesc}>People served, sessions held, products created</div>
              </div>
              <div className={styles.flowArrow}><ArrowRight size={20} /></div>
              <div className={styles.logicModelStep}>
                <div className={styles.stepIcon} style={{ background: '#fce7f3' }}>
                  <span style={{ color: '#db2777' }}>4</span>
                </div>
                <div className={styles.stepLabel}>Outcomes</div>
                <div className={styles.stepDesc}>Changes in knowledge, skills, behavior</div>
              </div>
              <div className={styles.flowArrow}><ArrowRight size={20} /></div>
              <div className={styles.logicModelStep}>
                <div className={styles.stepIcon} style={{ background: '#e0e7ff' }}>
                  <span style={{ color: '#4f46e5' }}>5</span>
                </div>
                <div className={styles.stepLabel}>Impact</div>
                <div className={styles.stepDesc}>Long-term community transformation</div>
              </div>
            </div>
          </section>

          {/* Six Evaluation Objectives */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Target size={20} />
              Six Core Evaluation Objectives
            </h3>
            <p className={styles.sectionDesc}>
              The framework organizes evaluation around six fundamental questions that matter to
              participants, staff, and funders.
            </p>
            <div className={styles.objectivesGrid}>
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveNumber}>1</div>
                <div className={styles.objectiveContent}>
                  <h4>Meet Participant Needs</h4>
                  <p>Are we helping participants achieve their personal goals?</p>
                </div>
              </div>
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveNumber}>2</div>
                <div className={styles.objectiveContent}>
                  <h4>Achieve Program Goals</h4>
                  <p>Are we meeting the outcomes we set out to achieve?</p>
                </div>
              </div>
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveNumber}>3</div>
                <div className={styles.objectiveContent}>
                  <h4>Improve Quality</h4>
                  <p>Are services being delivered as designed with high fidelity?</p>
                </div>
              </div>
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveNumber}>4</div>
                <div className={styles.objectiveContent}>
                  <h4>Increase Responsiveness</h4>
                  <p>Are we listening and adapting to participant feedback?</p>
                </div>
              </div>
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveNumber}>5</div>
                <div className={styles.objectiveContent}>
                  <h4>Ensure Accessibility</h4>
                  <p>Are services equitable and reaching those who need them?</p>
                </div>
              </div>
              <div className={styles.objectiveCard}>
                <div className={styles.objectiveNumber}>6</div>
                <div className={styles.objectiveContent}>
                  <h4>Engage Interest Groups</h4>
                  <p>Are funders, partners, and community engaged and satisfied?</p>
                </div>
              </div>
            </div>
          </section>

          {/* Four Phases */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <FileCheck size={20} />
              Four Evaluation Phases
            </h3>
            <p className={styles.sectionDesc}>
              A structured approach ensures evaluation is practical, participatory, and produces
              actionable results.
            </p>
            <div className={styles.phasesTimeline}>
              <div className={styles.phaseItem}>
                <div className={styles.phaseDot} style={{ background: '#0085ca' }}></div>
                <div className={styles.phaseBox}>
                  <h4>Phase 1: Planning & Initiation</h4>
                  <p>Engage sponsors, define objectives, establish advisory committee, confirm scope and resources.</p>
                </div>
              </div>
              <div className={styles.phaseItem}>
                <div className={styles.phaseDot} style={{ background: '#10b981' }}></div>
                <div className={styles.phaseBox}>
                  <h4>Phase 2: Design & Development</h4>
                  <p>Finalize evaluation questions, develop and pilot test data collection tools, configure systems.</p>
                </div>
              </div>
              <div className={styles.phaseItem}>
                <div className={styles.phaseDot} style={{ background: '#f59e0b' }}></div>
                <div className={styles.phaseBox}>
                  <h4>Phase 3: Implementation & Analysis</h4>
                  <p>Collect data ethically, analyze findings, deliver interim reports, hold sense-making sessions.</p>
                </div>
              </div>
              <div className={styles.phaseItem}>
                <div className={styles.phaseDot} style={{ background: '#8b5cf6' }}></div>
                <div className={styles.phaseBox}>
                  <h4>Phase 4: Communication & Use</h4>
                  <p>Draft final report, present to stakeholders, create action plan, facilitate implementation.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Principles */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Lightbulb size={20} />
              Key Principles
            </h3>
            <div className={styles.principlesGrid}>
              <div className={styles.principleItem}>
                <CheckCircle2 size={20} className={styles.checkIcon} />
                <div>
                  <strong>Utilization-focused</strong>
                  <p>Evaluation designed to be used, not just reported</p>
                </div>
              </div>
              <div className={styles.principleItem}>
                <CheckCircle2 size={20} className={styles.checkIcon} />
                <div>
                  <strong>Participatory</strong>
                  <p>Stakeholders involved in defining questions and interpreting results</p>
                </div>
              </div>
              <div className={styles.principleItem}>
                <CheckCircle2 size={20} className={styles.checkIcon} />
                <div>
                  <strong>Practical</strong>
                  <p>Appropriate methods for real-world resource constraints</p>
                </div>
              </div>
              <div className={styles.principleItem}>
                <CheckCircle2 size={20} className={styles.checkIcon} />
                <div>
                  <strong>Continuous improvement</strong>
                  <p>Learning and adaptation built into the process</p>
                </div>
              </div>
            </div>
          </section>

          {/* About LogicalOutcomes */}
          <section className={styles.aboutSection}>
            <div className={styles.aboutContent}>
              <Users size={24} className={styles.aboutIcon} />
              <div>
                <h4>About LogicalOutcomes</h4>
                <p>
                  LogicalOutcomes is a network of approximately 30 researchers, evaluators, and consultants
                  founded in 2013. Based in Toronto, they have helped hundreds of nonprofit organizations
                  design and implement practical evaluations that drive real improvements.
                </p>
                <a
                  href="https://logicaloutcomes.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.aboutLink}
                >
                  Visit logicaloutcomes.net <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </section>

          <div className={styles.ctaSection}>
            <button onClick={onClose} className={styles.ctaButton}>
              Create Your Evaluation Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutFramework;
