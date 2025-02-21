export type QuestionType = 'radio' | 'date' | 'text' | 'textarea' | 'number' | 'checklist' | 'checkbox' | 'toggleList'

export type QuestionOption = {
  label: string;
  value: number;
};

export type radioItem = {
  [key: string]: number;
};

export type checkListItem = string;

export type toggleListItem = {
  name: string;
  subtypes?: string[];
};

export type QuestionOptions = string[] | toggleListItem[] | radioItem | checkListItem[] | QuestionOption[];

export interface Question {
  id: string;
  title: string;
  type: QuestionType;
  options?: QuestionOptions;
  description?: string;
  warning?: string[];
  required?: boolean;
  min?: number;
  max?: number;
} 