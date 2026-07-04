export const features = {
  id: 'features',
  eyebrow: 'Our Special Features',
  title: 'A focused NCLEX testing workspace.',
  subheading:
    'The experience keeps instructions, question answering, navigation, and rationales close together without adding avoidable noise.',
  items: [
    {
      title: 'Organized learning material',
      subheading:
        'Start with clear instructions, visible test status, and a direct path into the next available question.',
      visual: {
        ariaLabel: 'Preview of grouped NCLEX learning material',
        label: 'Study folder',
        title: 'Readiness block',
        rows: ['Timed mode context', 'Question count', 'Resume-ready state'],
      },
    },
    {
      title: 'Practice with review context',
      subheading:
        'Answer single-choice, select-all, and numeric items with validation, disabled submit states, and immediate rationale review after submission.',
      visual: {
        ariaLabel: 'Preview of practice and review context',
        label: 'Practice set',
        title: 'Question panel',
        rows: ['Answer selection', 'Submit feedback', 'Explanation panel'],
      },
    },
    {
      title: 'A calmer preparation rhythm',
      subheading:
        'Move through the block with previous and next controls, a navigator list, and compact progress indicators.',
      visual: {
        ariaLabel: 'Preview of a calm progress summary',
        label: 'Progress',
        title: 'Test controls',
        rows: ['Navigator', 'Progress bar', 'Completion summary'],
      },
    },
  ],
}
