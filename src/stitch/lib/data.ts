import type { Flashcard } from '../types';

export const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: '1',
    cardFormat: "Two-Tier MCQ",
    questionStem: "If a red-flowered plant (RR) is crossed with a white-flowered plant (rr)...",
    tier1: {
      question: "...what percentage of the F1 generation will have red flowers?",
      options: ["25%", "50%", "75%", "100%"],
      correctAnswerIndex: 3,
      distractorRationale: {
        "0": "This would be the percentage of homozygous recessive offspring in the F2 generation, not the F1.",
        "1": "This might be expected in cases of incomplete dominance, but here red is fully dominant.",
        "2": "This is the phenotypic ratio of dominant to recessive traits in an F2 generation cross (Rr x Rr)."
      }
    },
    tier2: {
      question: "Which statement best explains your reasoning?",
      options: [
        "The F1 generation is heterozygous (Rr), and the dominant allele (R) for red flowers completely masks the effect of the recessive allele (r) for white flowers.",
        "The traits of the parents are blended in the offspring, resulting in pink flowers.",
        "Only the dominant parent's trait is passed on, so all offspring will be identical to the red-flowered parent."
      ],
      correctAnswerIndex: 0
    },
    topic: "Genetics",
    subTopic: "Mendelian Inheritance",
    bloomLevel: "Apply",
    dokLevel: 2,
  },
  {
    id: '2',
    cardFormat: 'text',
    front: 'What is JSX?',
    back: 'JSX stands for JavaScript XML. It is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files. It makes React code more readable and expressive.',
    questionStem: 'What is JSX?',
    topic: "React",
    subTopic: "Core Concepts",
    bloomLevel: "Remember",
    dokLevel: 1,
  },
  {
    id: '3',
    cardFormat: 'code',
    front: 'Write a basic `useState` implementation.',
    back: "```javascript\nimport { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```",
    questionStem: 'Write a basic `useState` implementation.',
    topic: "React",
    subTopic: "Hooks",
    bloomLevel: "Apply",
    dokLevel: 2,
  }
];




