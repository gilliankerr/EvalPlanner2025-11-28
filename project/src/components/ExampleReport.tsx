import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, FileText, Target, Users, BarChart3, Calendar, ClipboardList } from 'lucide-react';
import styles from './ExampleReport.module.css';

interface ExampleReportProps {
  onClose: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.collapsibleSection}>
      <button
        className={styles.sectionHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className={styles.sectionTitle}>
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className={styles.sectionContent}>
          {children}
        </div>
      )}
    </div>
  );
};

const ExampleReport: React.FC<ExampleReportProps> = ({ onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>Example Evaluation Plan</h2>
            <p className={styles.subtitle}>See what you'll receive after completing the form</p>
          </div>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.exampleBanner}>
            <FileText size={20} />
            <span>This is a sample report for a fictional organization</span>
          </div>

          <div className={styles.reportHeader}>
            <h1 className={styles.reportTitle}>
              Downtown Community Services — Youth Employment Program
              <br />
              <span className={styles.reportTitleSub}>Draft Evaluation Plan</span>
            </h1>
            <p className={styles.reportMeta}>
              Created by LogicalOutcomes Evaluation Planner
            </p>
          </div>

          <CollapsibleSection
            title="Program Summary & Analysis"
            icon={<Target size={18} />}
            defaultOpen={true}
          >
            <div className={styles.sectionText}>
              <h4>Summary of the program</h4>
              <p>
                The Youth Employment Program at Downtown Community Services addresses the challenge of youth unemployment
                in the urban core by providing comprehensive job readiness training, mentorship, and placement services
                to young adults aged 16-24. The program serves approximately 200 participants annually, focusing on
                those facing barriers to employment including lack of work experience, limited education, and
                socioeconomic challenges.
              </p>

              <h4>Activities</h4>
              <p><strong>Intake and Assessment</strong></p>
              <ul>
                <li>Completing initial intake assessment with career counselor</li>
                <li>Developing individual employment plan with goals</li>
              </ul>
              <p><strong>Skills Development</strong></p>
              <ul>
                <li>Attending weekly job readiness workshops</li>
                <li>Participating in resume writing and interview practice sessions</li>
                <li>Completing digital literacy training modules</li>
              </ul>
              <p><strong>Work Experience</strong></p>
              <ul>
                <li>Participating in 8-week paid work placement</li>
                <li>Receiving ongoing support from employment coach</li>
              </ul>

              <h4>Critical Success Factors</h4>
              <ol>
                <li><strong>Strong employer partnerships</strong> — Maintaining relationships with 50+ local employers willing to offer placements</li>
                <li><strong>Individualized support</strong> — Low staff-to-participant ratio enabling personalized coaching</li>
                <li><strong>Wraparound services</strong> — Addressing barriers like transportation and childcare</li>
                <li><strong>Post-placement follow-up</strong> — Continued support for 6 months after job placement</li>
              </ol>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Logic Model"
            icon={<BarChart3 size={18} />}
          >
            <div className={styles.tableWrapper}>
              <table className={styles.logicModelTable}>
                <thead>
                  <tr>
                    <th>INPUTS</th>
                    <th>ACTIVITIES</th>
                    <th>OUTPUTS</th>
                    <th>SHORT-TERM OUTCOMES</th>
                    <th>MID-TERM OUTCOMES</th>
                    <th>LONG-TERM OUTCOMES</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <ul>
                        <li>Trained career counselors</li>
                        <li>Employer partnerships</li>
                        <li>Training curriculum</li>
                        <li>Funding from city grants</li>
                      </ul>
                    </td>
                    <td>
                      <ul>
                        <li>Intake assessments</li>
                        <li>Job readiness workshops</li>
                        <li>Work placements</li>
                        <li>Employment coaching</li>
                        <li>Quality assurance</li>
                      </ul>
                    </td>
                    <td>
                      <ul>
                        <li>200 youth served annually</li>
                        <li>150 work placements</li>
                        <li>40 workshops delivered</li>
                      </ul>
                    </td>
                    <td>
                      <ul>
                        <li>Increased job readiness skills</li>
                        <li>Improved confidence</li>
                        <li>Work experience gained</li>
                      </ul>
                    </td>
                    <td>
                      <ul>
                        <li>Secure employment</li>
                        <li>Retain employment 6+ months</li>
                        <li>Increased income</li>
                      </ul>
                    </td>
                    <td>
                      <ul>
                        <li>Financial stability</li>
                        <li>Career advancement</li>
                        <li>Reduced youth unemployment</li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Evaluation Framework"
            icon={<ClipboardList size={18} />}
          >
            <div className={styles.tableWrapper}>
              <table className={styles.frameworkTable}>
                <thead>
                  <tr>
                    <th>Logic Model Element</th>
                    <th>Measure</th>
                    <th>Respondent</th>
                    <th>Data Collection</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={styles.tableSubheader}>
                    <td colSpan={4}><strong>OUTPUTS (reported quarterly)</strong></td>
                  </tr>
                  <tr>
                    <td>Participants served</td>
                    <td># youth enrolled, demographics</td>
                    <td>Program manager</td>
                    <td>Client record system</td>
                  </tr>
                  <tr>
                    <td>Services provided</td>
                    <td># workshops, # placements, # coaching sessions</td>
                    <td>Program manager</td>
                    <td>Activity tracking</td>
                  </tr>
                  <tr className={styles.tableSubheader}>
                    <td colSpan={4}><strong>SHORT-TERM OUTCOMES (reported quarterly)</strong></td>
                  </tr>
                  <tr>
                    <td>Meet participant needs</td>
                    <td>Goal achievement rating</td>
                    <td>Participant</td>
                    <td>Exit survey</td>
                  </tr>
                  <tr>
                    <td>Increase job readiness</td>
                    <td>Skills assessment score (pre/post)</td>
                    <td>Participant</td>
                    <td>Standardized assessment</td>
                  </tr>
                  <tr className={styles.tableSubheader}>
                    <td colSpan={4}><strong>MID-TERM OUTCOMES (reported annually)</strong></td>
                  </tr>
                  <tr>
                    <td>Achieve employment</td>
                    <td>% placed in employment within 3 months</td>
                    <td>Program manager</td>
                    <td>Follow-up tracking</td>
                  </tr>
                  <tr>
                    <td>Retain employment</td>
                    <td>% employed at 6-month follow-up</td>
                    <td>Participant</td>
                    <td>Phone follow-up</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Evaluation Phases & Timeline"
            icon={<Calendar size={18} />}
          >
            <div className={styles.phasesContainer}>
              <div className={styles.phase}>
                <div className={styles.phaseNumber}>1</div>
                <div className={styles.phaseContent}>
                  <h4>Planning & Initiation</h4>
                  <p>3-8 weeks</p>
                  <ul>
                    <li>Engage project sponsor and team</li>
                    <li>Define evaluation objectives</li>
                    <li>Establish advisory committee</li>
                  </ul>
                </div>
              </div>
              <div className={styles.phase}>
                <div className={styles.phaseNumber}>2</div>
                <div className={styles.phaseContent}>
                  <h4>Design & Development</h4>
                  <p>1-12 weeks</p>
                  <ul>
                    <li>Finalize evaluation questions</li>
                    <li>Develop data collection tools</li>
                    <li>Pilot test instruments</li>
                  </ul>
                </div>
              </div>
              <div className={styles.phase}>
                <div className={styles.phaseNumber}>3</div>
                <div className={styles.phaseContent}>
                  <h4>Implementation & Analysis</h4>
                  <p>Ongoing</p>
                  <ul>
                    <li>Collect and manage data</li>
                    <li>Analyze findings</li>
                    <li>Interim reporting</li>
                  </ul>
                </div>
              </div>
              <div className={styles.phase}>
                <div className={styles.phaseNumber}>4</div>
                <div className={styles.phaseContent}>
                  <h4>Communication & Use</h4>
                  <p>3-6 weeks</p>
                  <ul>
                    <li>Draft final report</li>
                    <li>Present to stakeholders</li>
                    <li>Create action plan</li>
                  </ul>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Roles & Responsibilities"
            icon={<Users size={18} />}
          >
            <div className={styles.rolesGrid}>
              <div className={styles.roleCard}>
                <h4>Sponsor</h4>
                <p>Senior manager responsible for implementing recommendations. Provides guidance, removes roadblocks, approves deliverables.</p>
              </div>
              <div className={styles.roleCard}>
                <h4>Liaison</h4>
                <p>Organization's primary contact. Coordinates internally, schedules meetings, manages day-to-day communication.</p>
              </div>
              <div className={styles.roleCard}>
                <h4>Project Owner</h4>
                <p>Senior evaluator providing leadership. Defines methodology, reviews deliverables, manages strategic issues.</p>
              </div>
              <div className={styles.roleCard}>
                <h4>Project Manager</h4>
                <p>Evaluator managing implementation. Monitors timeline and budget, coordinates data collection, drafts reports.</p>
              </div>
            </div>
          </CollapsibleSection>

          <div className={styles.ctaSection}>
            <p>Ready to create your own evaluation plan?</p>
            <button onClick={onClose} className={styles.ctaButton}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleReport;
