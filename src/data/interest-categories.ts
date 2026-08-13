export interface InterestCategory {
  id: string;
  label: string;
  items: string[];
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'sports',
    label: 'Sports & Fitness',
    items: ['Football', 'Basketball', 'Athletics', 'Swimming', 'Volleyball', 'Rugby', 'Tennis', 'Boxing', 'Martial Arts', 'Cricket']
  },
  {
    id: 'arts',
    label: 'Arts & Creative',
    items: ['Music', 'Drawing & Painting', 'Dance', 'Photography', 'Sculpture', 'Graphic Design', 'Crafts', 'Pottery']
  },
  {
    id: 'technology',
    label: 'Technology',
    items: ['Coding', 'Gaming', 'Robotics', 'App Development', 'Web Design', 'AI & Machine Learning', 'Hardware', 'Cybersecurity']
  },
  {
    id: 'science',
    label: 'Science & Research',
    items: ['Biology', 'Chemistry experiments', 'Math puzzles', 'Astronomy', 'Environmental science', 'Physics', 'Geology']
  },
  {
    id: 'community',
    label: 'Community & Leadership',
    items: ['Debate club', 'Student council', 'Volunteering', 'Mentoring', 'Event organizing', 'Public speaking']
  },
  {
    id: 'business',
    label: 'Business & Finance',
    items: ['Entrepreneurship', 'Selling', 'Budgeting', 'Investing', 'Marketing', 'Negotiation']
  },
  {
    id: 'media',
    label: 'Media & Content',
    items: ['YouTube', 'Blogging', 'Social media', 'Writing', 'Podcasting', 'Journalism', 'Video editing']
  }
];
