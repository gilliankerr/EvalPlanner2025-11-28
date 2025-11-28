# Primary Objective

Analyze all available information and, using your expertise and web search as needed, define the program's key terms, goals, activities, target populations, and intended outcomes. Where details are missing, infer them based on best practices and analogous programs, clearly flagging any assumptions. Use the organization's own vocabulary when possible. Be sure you are focusing on {{programName}} and not on other programs delivered by the organization!

---

## Program Information

**Organization:** {{organizationName}}
**Program Name:** {{programName}}

**About the Program:**
{{aboutProgram}}

**Web Content:**
{{scrapedContent}}

---

## Output Requirements

Based on the provided information, do the following:

Identify and describe the underlying program model by analyzing:

* Target population and presenting issues addressed
* Core intervention strategies and service delivery methods
* Theoretical foundations and logic model (implicit or explicit)
* Program goals, intended outcomes, and theory of change
* Service intensity, duration, and delivery setting
* Staff roles and qualifications required

Deliver a comprehensive program model description including:

* Classification within established program typologies
* Key assumptions about how change occurs
* Primary mechanisms of action
* Comparison to similar evidence-based models in the literature

## Structured Data Extraction

After completing the comprehensive narrative analysis above, provide exactly one JSON object at the end with these specific keys:

- **program_type_plural**: A concise phrase describing the general type/category of program in plural form (e.g., "financial literacy programs", "mental health services", "after-school programs", "workforce development programs")
- **target_population**: A specific description of who the program serves (e.g., "low-income families in urban areas", "youth ages 12-18", "adults with substance use disorders", "rural communities")

Example JSON format:
```json
{
  "program_type_plural": "financial literacy programs",
  "target_population": "low-income adults in Toronto"
}
```
