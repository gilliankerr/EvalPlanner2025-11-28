import { generateFullHtmlDocument } from './src/utils/reportGenerator.mjs';

const mockEvaluationPlan = `
# Test Program Evaluation Plan

## Introduction
This is a test plan.

## Logic Model
| Inputs | Activities | Outputs | Outcomes |
|--------|------------|---------|----------|
| Money  | Work       | Product | Success  |

## Timeline
| Phase | Date |
|-------|------|
| 1     | Jan  |
`;

try {
  console.log('Starting report generation...');
  const html = generateFullHtmlDocument(mockEvaluationPlan, {
    programName: 'Test Program',
    organizationName: 'Test Org',
    includePrintButton: true
  });
  
  if (!html || html.length === 0) {
    console.error('FAILED: Generated HTML is empty');
  } else {
    console.log('SUCCESS: HTML generated successfully');
    console.log('Length:', html.length);
    console.log('First 100 chars:', html.substring(0, 100));
  }
} catch (error) {
  console.error('ERROR:', error);
}